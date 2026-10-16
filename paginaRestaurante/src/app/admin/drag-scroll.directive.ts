import { DestroyRef, Directive, ElementRef, NgZone, inject } from '@angular/core';

/** Arrastrar con el botón principal desplaza el contenedor bajo el cursor. */
@Directive({ selector: '[appDragScroll]', standalone: true })
export class DragScrollDirective {
  constructor() {
    const host = inject(ElementRef<HTMLElement>).nativeElement;
    const destroy = inject(DestroyRef);
    const zone = inject(NgZone);
    zone.runOutsideAngular(() => {
      let gesture: { id: number; x: number; y: number; active: boolean; parents: HTMLElement[] } | undefined;
      let suppressClick = false;
      const down = (event: PointerEvent) => {
        suppressClick = false;
        if (event.pointerType !== 'mouse' || event.button !== 0 || !(event.target instanceof HTMLElement)) return;
        if (event.target.closest('input, textarea, select, [contenteditable], [draggable="true"], .is-draggable, .crop-frame, .adjust-frame')) return;
        const parents: HTMLElement[] = [];
        for (let node: HTMLElement | null = event.target; node; node = node.parentElement) {
          const style = getComputedStyle(node);
          if (/(auto|scroll)/.test(style.overflowY + style.overflowX)) parents.push(node);
          // El modal desplaza su contenido sin mover la página de fondo.
          if (node instanceof HTMLDialogElement && node.open) break;
        }
        if (!event.target.closest('dialog[open]') && document.scrollingElement instanceof HTMLElement && !parents.includes(document.scrollingElement)) parents.push(document.scrollingElement);
        gesture = { id: event.pointerId, x: event.clientX, y: event.clientY, active: false, parents };
      };
      const move = (event: PointerEvent) => {
        if (!gesture || event.pointerId !== gesture.id) return;
        if (!(event.buttons & 1)) { stop(); return; }
        const dx = gesture.x - event.clientX;
        const dy = gesture.y - event.clientY;
        if (!gesture.active && Math.hypot(dx, dy) < 6) return;
        gesture.active = true;
        suppressClick = true;
        host.classList.add('drag-scrolling');
        event.preventDefault();
        let remainingX = dx, remainingY = dy;
        for (const parent of gesture.parents) {
          const x = parent.scrollLeft, y = parent.scrollTop;
          parent.scrollLeft += remainingX;
          parent.scrollTop += remainingY;
          remainingX -= parent.scrollLeft - x;
          remainingY -= parent.scrollTop - y;
        }
        gesture.x = event.clientX; gesture.y = event.clientY;
      };
      const stop = () => { gesture = undefined; host.classList.remove('drag-scrolling'); };
      const click = (event: MouseEvent) => {
        if (!suppressClick || event.detail === 0) return;
        suppressClick = false;
        event.preventDefault(); event.stopImmediatePropagation();
      };
      const drag = (event: DragEvent) => { if (gesture) event.preventDefault(); };
      host.addEventListener('pointerdown', down);
      host.addEventListener('click', click, true);
      host.addEventListener('dragstart', drag);
      document.addEventListener('pointermove', move, { passive: false });
      document.addEventListener('pointerup', stop);
      document.addEventListener('pointercancel', stop);
      window.addEventListener('blur', stop);
      destroy.onDestroy(() => {
        stop();
        host.removeEventListener('pointerdown', down);
        host.removeEventListener('click', click, true);
        host.removeEventListener('dragstart', drag);
        document.removeEventListener('pointermove', move);
        document.removeEventListener('pointerup', stop);
        document.removeEventListener('pointercancel', stop);
        window.removeEventListener('blur', stop);
      });
    });
  }
}
