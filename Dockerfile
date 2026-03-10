
# ---- Dependencies Stage ----
FROM node:22-alpine

WORKDIR /app

# Copy lock and manifest files
COPY package*.json / 


# Install dependencies using Bun
RUN npm install -g bun

RUN bun install

# Copy all source files to builder
COPY . .

# # Build your app
# RUN bun run build

# # Optionally prune devDependencies (Bun doesn't have npm prune equivalent yet)
# # If you want minimal production-only dependencies, Bun currently installs only what's needed for start/build

# # ---- Production Runner Stage ----
# FROM oven/bun:1.0.33-alpine AS runner



# WORKDIR /app

# COPY --from=dependencies /dist /app/dist

EXPOSE 3030

# Start your Bun app with the "start" script from package.json
CMD ["bun", "run", "dev", "--", "--host", "0.0.0.0"]
