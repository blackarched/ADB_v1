# Stage 1: Build/Install Dependencies
FROM node:18-alpine AS builder

WORKDIR /app

# Install ADB tools and other necessary OS packages
# Using apk add --no-cache to keep the layer small
RUN apk add --no-cache \
    bash \
    openjdk17-jre-headless \
    android-tools \
    && rm -rf /var/cache/apk/*

# Copy package.json and package-lock.json (or npm-shrinkwrap.json)
COPY package.json package-lock.json* ./

# Install only production dependencies
RUN npm ci --omit=dev --ignore-scripts

# Copy the rest of the application code
COPY . .

# Stage 2: Production Image
FROM node:18-alpine AS production

WORKDIR /app

# Create a non-root user and group
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
RUN chown -R appuser:appgroup /app

# Install ADB tools and other necessary OS packages again for the final stage
# This ensures they are present in the lean final image.
# openjdk is needed by some adb functionalities or other android tools.
RUN apk add --no-cache \
    bash \
    openjdk17-jre-headless \
    android-tools \
    && rm -rf /var/cache/apk/*

# Copy dependencies from builder stage
COPY --from=builder /app/node_modules ./node_modules
# Copy application code from builder stage
COPY --from=builder /app .

# Ensure all files are owned by the appuser
RUN chown -R appuser:appgroup /app

# Switch to the non-root user
USER appuser

# Expose the port the app runs on (as defined in .env or server.js default)
# This should match the PORT variable used in server.js
EXPOSE 3001

# Command to run the application
# Ensure server.js is executable or called with node
CMD ["node", "server.js"]
