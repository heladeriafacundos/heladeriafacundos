# 📌 Proyecto: Enigmas

## 📖 Descripción
Este repositorio contiene el código fuente para [nombre de la página web]. Aquí colaboramos en el desarrollo y mejora del sitio web. 

## 🚀 Tecnologías
- HTML
- CSS (Bootstrap o Tailwind TBD)
- React + Next.JS
- Supabase
- Deploy en Vercel

---

## 🛠️ Configuración del Proyecto
### 1️⃣ Clonar o Actualizar el Repositorio
Si es la primera vez que descargas el repositorio, clónalo con:
```sh
git clone https://github.com/testeoparaweb/testeoparaweb.git
```

Si ya tienes el repositorio clonado y solo quieres actualizarlo con los últimos cambios, usa:
```sh
git pull origin main
```

### 2️⃣ Crear una Rama para tu Trabajo
Siempre crea una rama nueva para cada nueva funcionalidad o corrección:
```sh
git checkout -b nombre-de-la-rama
```

### 3️⃣ Subir Cambios y Hacer un Pull Request (PR)
1. **Agregar archivos modificados:**
   ```sh
   git add .
   ```
2. **Hacer un commit con un mensaje claro:**
   ```sh
   git commit -m "Descripción clara del cambio"
   ```
3. **Subir la rama a GitHub:**
   ```sh
   git push origin nombre-de-la-rama
   ```
4. **Crear un Pull Request (PR)** en GitHub desde la rama que creaste hacia `main`.
5. Esperar revisión y feedback antes de hacer merge.

### 4️⃣ Mantener el Repositorio Actualizado
Antes de empezar a trabajar, asegúrate de que tu rama local esté actualizada con `main`:
```sh
git checkout main
git pull origin main
git checkout nombre-de-la-rama
git merge main
```
Si hay conflictos, resuélvelos antes de continuar.

---

## 🔄 Paso a Paso: Guardar y Subir Cambios a GitHub
1️⃣ **Clonar el repositorio** (solo la primera vez):
   ```sh
   git clone https://github.com/tu-usuario/nombre-del-repo.git
   ```

2️⃣ **Crear o cambiar a una nueva rama**:
   ```sh
   git checkout -b mi-nueva-rama
   ```

3️⃣ **Editar archivos** (modificar código, agregar imágenes, etc.).

4️⃣ **Agregar los cambios al área de preparación**:
   ```sh
   git add .
   ```

5️⃣ **Hacer un commit (guardar cambios localmente)**:
   ```sh
   git commit -m "Descripción clara del cambio"
   ```

6️⃣ **Subir los cambios a GitHub**:
   ```sh
   git push origin mi-nueva-rama
   ```

7️⃣ **Crear un Pull Request (PR) en GitHub** para revisión y fusión en `main`.

---

❗ **Punto adicional**: Si quiero descartar mis cambios y volver a la version que esta en el main debo ejecutar los siguiente comandos:
   ```sh
   # Reset any uncommitted changes
   git reset --hard HEAD

   # Fetch the latest changes from the remote repository
   git fetch origin
   
   # Reset your branch to match the remote main branch
   git reset --hard origin/main
   
   # Clean up untracked files (optional, use with caution)
   git clean -fd
   ```

## 💡 Buenas Prácticas
✅ Usa nombres descriptivos para ramas y commits.
✅ Revisa los PRs de otros compañeros antes de aprobarlos.
✅ No hagas cambios en `main` directamente.
✅ Pregunta en caso de dudas.

---

## ❓ Preguntas o Dudas
Si tienes dudas, usa la sección de **Issues** en GitHub o pregunta en nuestro canal de comunicación.

¡Vamos a construir algo increíble juntos! 🚀

