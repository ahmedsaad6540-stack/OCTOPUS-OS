FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy the built output from the api-server
# Since it's bundled by esbuild/vite, we only need the dist folder
COPY dist ./dist

# The app listens on PORT
ENV PORT=5000
EXPOSE 5000

# Start the application
CMD ["node", "dist/index.mjs"]
