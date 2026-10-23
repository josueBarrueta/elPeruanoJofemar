# PaginaRestaurante

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 20.0.4.

## Development server

To start a local development server, run:

```bash
ng serve
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## Building

To build the project run:

```bash
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

## Running unit tests

To execute unit tests with the [Karma](https://karma-runner.github.io) test runner, use the following command:

```bash
ng test
```

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.

## Sesiones de administración

Las sesiones de la API caducan a las 8 horas desde el login, también tras reiniciar el servidor.
El servidor comprueba la caducidad en cada petición privada; MongoDB elimina después los registros
caducados con un índice TTL. Las sesiones antiguas sin fecha de caducidad dejan de ser válidas.
Cambiar `ADMIN_PASSWORD` o `ADMIN_EMAIL` en Render y reiniciar o desplegar la API invalida
los tokens anteriores. El cambio afecta a todos los dispositivos: deben volver a iniciar sesión.
El login admite hasta 10 solicitudes cada 15 minutos por proceso para la cuenta compartida;
el límite devuelve HTTP 429 y `Retry-After`. Se reinicia al reiniciar el proceso y no se comparte
entre réplicas; con varias instancias se debe usar un limitador compartido o protección del alojamiento.
