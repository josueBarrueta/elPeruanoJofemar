import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent {
  // Aquí puedes agregar propiedades y lógica del componente
  title = 'Bienvenidos a El Peruano Jofemar';
  
  // Ejemplo de platos destacados
  featuredDishes = [
    {
      name: 'Ceviche',
      description: 'El clásico ceviche peruano preparado con pescado fresco, limón, cebolla y ají limo.',
      image: 'https://via.placeholder.com/300x200?text=Ceviche'
    },
    {
      name: 'Lomo Saltado',
      description: 'Delicioso lomo fino salteado con cebolla, tomate y papas fritas, servido con arroz.',
      image: 'https://via.placeholder.com/300x200?text=Lomo+Saltado'
    }
  ];
}
