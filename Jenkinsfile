// Pipeline CI de NeoWallet.
// En cada commit: valida sintaxis → construye → levanta el stack → healthchecks
// → corre la suite de API (Newman) → limpia. Requiere un agente con Docker + Compose v2.
pipeline {
  agent any

  options {
    timeout(time: 30, unit: 'MINUTES')
    disableConcurrentBuilds()
  }

  environment {
    // Valores de CI (no usar en producción). El arranque seguro solo falla con
    // NODE_ENV=production; en CI se deja en desarrollo.
    JWT_SECRET       = 'ci_secret_neowallet'
    INTERNAL_API_KEY = 'ci_internal_neowallet'
    SEED_PASSWORD    = 'neowallet123'
  }

  stages {
    stage('Checkout') {
      steps { checkout scm }
    }

    stage('Validar sintaxis (backend)') {
      steps {
        sh '''
          docker run --rm -v "$PWD":/app -w /app node:20-alpine sh -lc '
            for f in $(find accounts-service processor-service -name "*.js" -not -path "*/node_modules/*"); do
              node --check "$f" || exit 1
            done
            echo "sintaxis OK"
          '
        '''
      }
    }

    stage('Build') {
      steps { sh 'docker compose build' }
    }

    stage('Levantar stack') {
      steps { sh 'docker compose up -d' }
    }

    stage('Healthchecks') {
      steps {
        sh '''
          for url in http://localhost:3000/health http://localhost:3001/health; do
            echo "esperando $url"
            for i in $(seq 1 30); do
              if curl -sf "$url" >/dev/null; then echo "  OK"; break; fi
              if [ "$i" = "30" ]; then echo "  TIMEOUT $url"; exit 1; fi
              sleep 2
            done
          done
        '''
      }
    }

    stage('Pruebas de API (Newman)') {
      steps {
        sh '''
          docker run --rm --network host \
            -v "$PWD/tests/postman:/etc/newman" \
            postman/newman:alpine run /etc/newman/NeoWallet.postman_collection.json \
            --reporters cli
        '''
      }
    }
  }

  post {
    failure {
      sh 'docker compose logs --tail=150 || true'
    }
    always {
      sh 'docker compose down -v || true'
    }
  }
}
