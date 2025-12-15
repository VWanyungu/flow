FROM node:18-slim AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .

ARG VITE_SPOTIFY_CLIENT_ID
ARG VITE_SPOTIFY_CLIENT_SECRET
ARG VITE_SPOTIFY_REDIRECT_URI
ARG VITE_SPOTIFY_SCOPE
ARG VITE_SPOTIFY_AUTH_URL

ENV VITE_SPOTIFY_CLIENT_ID=41217831f42a45ffa6c96d4dc51b4c61 \
    VITE_SPOTIFY_CLIENT_SECRET=9066c749df1e4546a493cde2466bfa5c \
    VITE_SPOTIFY_REDIRECT_URI=http://127.0.0.1:5173 \
    VITE_SPOTIFY_SCOPE="user-read-private user-read-email playlist-modify-public playlist-modify-private" \
    VITE_SPOTIFY_AUTH_URL=https://accounts.spotify.com/authorize

RUN npm run build

FROM nginx:stable-alpine AS production
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]

