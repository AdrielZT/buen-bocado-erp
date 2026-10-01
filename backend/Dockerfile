# Multi-stage Dockerfile optimizado para Google Cloud Run (Java 21 LTS)
# Stage 1: Build
FROM eclipse-temurin:21-jdk-alpine AS builder
WORKDIR /workspace/app

# Instalar maven
RUN apk add --no-cache maven

COPY pom.xml .
# Descarga de dependencias offline
RUN mvn dependency:go-offline -B

COPY src src
RUN mvn clean package -DskipTests -B

# Stage 2: Runtime ultraligero
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

RUN addgroup -S spring && adduser -S spring -G spring
USER spring:spring

COPY --from=builder /workspace/app/target/*.jar app.jar

ENV PORT=8080
EXPOSE 8080

# Flags de afinación de JVM para Cloud Run (Límite estricto 512MB RAM)
ENTRYPOINT ["java", \
  "-XX:+UseSerialGC", \
  "-Xms128m", \
  "-Xmx384m", \
  "-XX:MaxMetaspaceSize=96m", \
  "-XX:+TieredCompilation", \
  "-XX:TieredStopAtLevel=1", \
  "-Djava.security.egd=file:/dev/./urandom", \
  "-jar", "app.jar"]
