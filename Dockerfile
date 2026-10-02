FROM mcr.microsoft.com/playwright:v1.56.1-noble

WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .

ENV CI=1
CMD ["npx", "playwright", "test"]
