# Usa la imagen oficial de Playwright recomendada para asegurar que los navegadores y sus dependencias estén instalados
FROM mcr.microsoft.com/playwright:v1.42.1-jammy

# Crea y establece el directorio de trabajo dentro del contenedor
WORKDIR /app

# Copia los archivos de configuración de npm (package.json y package-lock.json si existe)
COPY package*.json ./

# Instala las dependencias de Node.js (express, cors, playwright)
RUN npm install

# Copia el resto de los archivos del proyecto (server.js y la carpeta public)
COPY . .

# Expone el puerto 3000 para que funcione con el proxy inverso de Coolify
EXPOSE 3000

# Comando de inicio del servidor
CMD ["node", "server.js"]
