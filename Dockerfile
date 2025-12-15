FROM node:18-alpine AS build
WORKDIR /frontend
COPY /frontend/package*.json ./
RUN npm install
COPY frontend/ .
RUN npm run build

FROM nginx:stable-alpine AS production
COPY --from=build /frontend/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]

