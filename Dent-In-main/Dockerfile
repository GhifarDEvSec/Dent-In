# Multi-stage build for Spring Boot
# Stage 1: Build
FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /app
COPY pom.xml .
RUN mvn dependency:go-offline -B
COPY src ./src
RUN mvn clean package -DskipTests -B

# Stage 2: Run
FROM eclipse-temurin:21-jre-jammy
WORKDIR /app

# Create uploads directory
RUN mkdir -p /app/uploads

# Copy jar from build stage
COPY --from=build /app/target/*.jar app.jar

# Expose port
EXPOSE 8080

# Run with environment variables
ENTRYPOINT ["java", "-jar", "app.jar"]
