import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

interface MenuCategory {
  id: string;
  title: string;
  isOpen: boolean;
  items: {
    name: string;
    price: number;
    description: string;
  }[];
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {
  menuCategories: MenuCategory[] = [
    {
      id: 'entradas',
      title: 'Entradas',
      isOpen: false,
      items: [
        { name: 'Causa Limeña', price: 8.50, description: 'Deliciosa causa rellena de pollo o atún, con aguacate y mayonesa de ají amarillo.' },
        { name: 'Papa a la Huancaína', price: 7.50, description: 'Patatas cocidas bañadas en nuestra exquisita salsa de queso y ají amarillo.' },
        { name: 'Tequeños', price: 6.50, description: 'Delicados rollitos de masa rellenos de queso, acompañados de guacamole.' }
      ]
    },
    {
      id: 'principales',
      title: 'Platos Principales',
      isOpen: false,
      items: [
        { name: 'Ceviche de Pescado', price: 14.90, description: 'Pescado fresco marinado en jugo de limón, con cebolla, ají y camote.' },
        { name: 'Lomo Saltado', price: 15.50, description: 'Trozos tiernos de lomo de res salteados con cebolla, tomate y papas fritas.' },
        { name: 'Arroz con Mariscos', price: 16.90, description: 'Arroz con una selección de mariscos frescos y salsa de la casa.' }
      ]
    },
    {
      id: 'bebidas',
      title: 'Bebidas',
      isOpen: false,
      items: [
        { name: 'Chicha Morada', price: 2.50, description: 'Refrescante bebida peruana hecha de maíz morado.' },
        { name: 'Pisco Sour', price: 5.50, description: 'El cóctel bandera del Perú, preparado con pisco, limón, clara de huevo y amargo de angostura.' }
      ]
    }
  ];

  constructor() { }

  ngOnInit(): void {
    // Opcional: Abrir la primera categoría por defecto
    if (this.menuCategories.length > 0) {
      this.toggleCategory(this.menuCategories[0]);
    }
  }

  toggleCategory(category: MenuCategory): void {
    // Cerrar todas las categorías primero
    this.menuCategories.forEach(cat => {
      if (cat.id !== category.id) {
        cat.isOpen = false;
      }
    });
    // Alternar la categoría seleccionada
    category.isOpen = !category.isOpen;
  }
}
