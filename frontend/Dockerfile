FROM node:22-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

EXPOSE 5173
RUN chmod +x /app/docker-entrypoint.sh
ENTRYPOINT ["sh", "/app/docker-entrypoint.sh"]
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "5173"]