
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Site Indisponível</title>
    <style>
        body {
            margin: 0;
            padding: 0;
            overflow: hidden;
            background: linear-gradient(to bottom, #000000, #0a0a2a);
            font-family: 'Orbitron', sans-serif; /* Fonte futurística */
            color: #ffffff;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            height: 100vh;
            position: relative;
        }

        /* Fundo com estrelas */
        .stars {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: transparent;
            animation: twinkle 5s infinite;
        }

        .stars::before {
            content: '';
            position: absolute;
            width: 2px;
            height: 2px;
            background: #ffffff;
            box-shadow: 
                10vw 20vh 0 #fff, 20vw 30vh 0 #fff, 30vw 10vh 0 #fff,
                40vw 50vh 0 #fff, 50vw 70vh 0 #fff, 60vw 40vh 0 #fff,
                70vw 80vh 0 #fff, 80vw 60vh 0 #fff, 90vw 90vh 0 #fff,
                15vw 25vh 0 #fff, 25vw 35vh 0 #fff, 35vw 15vh 0 #fff,
                45vw 55vh 0 #fff, 55vw 75vh 0 #fff, 65vw 45vh 0 #fff,
                75vw 85vh 0 #fff, 85vw 65vh 0 #fff, 95vw 95vh 0 #fff,
                5vw 10vh 0 #fff, 15vw 5vh 0 #fff, 25vw 15vh 0 #fff; /* Mais estrelas */
            opacity: 0.5;
            animation: twinkle 2s infinite;
        }

        @keyframes twinkle {
            0%, 100% { opacity: 0.5; }
            50% { opacity: 1; }
        }

        /* Conteúdo principal */
        .content {
            text-align: center;
            z-index: 1;
            animation: glow 2s ease-in-out infinite alternate;
        }

        h1 {
            font-size: 4em;
            text-shadow: 0 0 10px #00ffcc, 0 0 20px #00ffcc, 0 0 30px #00ffcc, 0 0 40px #00ffcc;
            margin: 0;
        }

        p {
            font-size: 1.5em;
            text-shadow: 0 0 5px #00ffcc;
        }

        #score {
            font-size: 2em;
            margin-top: 10px;
        }

        @keyframes glow {
            from {
                text-shadow: 0 0 10px #00ffcc, 0 0 20px #00ffcc;
            }
            to {
                text-shadow: 0 0 20px #00ffcc, 0 0 30px #00ffcc, 0 0 40px #00ffcc, 0 0 50px #00ffcc;
            }
        }

        /* Canvas para o jogo Pong */
        #pongCanvas {
            border: 2px solid #00ffcc;
            box-shadow: 0 0 20px #00ffcc;
            background: rgba(0, 0, 0, 0.5);
            margin-top: 20px;
            touch-action: none; /* Previne scroll padrão no touch */
        }

        /* Partículas futurísticas */
        .particles {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
        }

        .particle {
            position: absolute;
            width: 5px;
            height: 5px;
            background: #00ffcc;
            border-radius: 50%;
            animation: float 10s infinite linear;
            opacity: 0.7;
        }

        .particle:nth-child(1) { left: 10%; animation-duration: 15s; }
        .particle:nth-child(2) { left: 20%; animation-duration: 12s; }
        .particle:nth-child(3) { left: 30%; animation-duration: 18s; }
        .particle:nth-child(4) { left: 40%; animation-duration: 14s; }
        .particle:nth-child(5) { left: 50%; animation-duration: 16s; }
        .particle:nth-child(6) { left: 60%; animation-duration: 13s; }
        .particle:nth-child(7) { left: 70%; animation-duration: 17s; }
        .particle:nth-child(8) { left: 80%; animation-duration: 11s; }
        .particle:nth-child(9) { left: 90%; animation-duration: 19s; }
        .particle:nth-child(10) { left: 5%; animation-duration: 20s; }

        @keyframes float {
            0% { transform: translateY(100vh); }
            100% { transform: translateY(-100vh); }
        }

        /* Efeito de grade holográfica */
        .grid {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-image: 
                linear-gradient(to right, rgba(0, 255, 204, 0.1) 1px, transparent 1px),
                linear-gradient(to bottom, rgba(0, 255, 204, 0.1) 1px, transparent 1px);
            background-size: 50px 50px;
            animation: scan 5s linear infinite;
            opacity: 0.3;
        }

        @keyframes scan {
            0% { background-position: 0 0; }
            100% { background-position: 50px 50px; }
        }

        /* Importar fonte futurística */
        @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700&display=swap');
    </style>
</head>
<body>
    <div class="stars"></div>
    <div class="grid"></div>
    <div class="particles">
        <div class="particle"></div>
        <div class="particle"></div>
        <div class="particle"></div>
        <div class="particle"></div>
        <div class="particle"></div>
        <div class="particle"></div>
        <div class="particle"></div>
        <div class="particle"></div>
        <div class="particle"></div>
        <div class="particle"></div>
    </div>
    <div class="content">
        <h1>Site Indisponível no Momento!</h1>
        <p>Estamos atualizando para um futuro melhor. Volte em breve.</p>
        <p>Enquanto isso, jogue Pong contra a IA! Use Setas Cima/Baixo ou arraste o dedo na tela para controlar a raquete direita.</p>
        <p id="score">Pontuação IA - Jogador: 0 - 0</p>
    </div>
    <canvas id="pongCanvas" width="800" height="400"></canvas>
    <script>
        const canvas = document.getElementById('pongCanvas');
        const ctx = canvas.getContext('2d');
        const scoreElement = document.getElementById('score');

        // Configurações do jogo
        const paddleWidth = 10;
        const paddleHeight = 100;
        const ballSize = 10;
        const paddleSpeed = 5;
        const ballSpeed = 2;
        const aiSpeed = 4; // Velocidade da IA, um pouco mais lenta para ser jogável

        // Posições iniciais
        let leftPaddleY = (canvas.height - paddleHeight) / 2;
        let rightPaddleY = (canvas.height - paddleHeight) / 2;
        let ballX = canvas.width / 2;
        let ballY = canvas.height / 2;
        let ballDX = ballSpeed;
        let ballDY = ballSpeed * (Math.random() > 0.5 ? 1 : -1);

        let leftScore = 0;
        let rightScore = 0;

        // Controles de teclado
        const keys = {};

        window.addEventListener('keydown', (e) => {
            keys[e.key] = true;
        });

        window.addEventListener('keyup', (e) => {
            keys[e.key] = false;
        });

        // Controles touch para mobile
        let isTouching = false;
        let startTouchY = 0;
        let startPaddleY = 0;

        canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            isTouching = true;
            const rect = canvas.getBoundingClientRect();
            startTouchY = e.touches[0].clientY - rect.top;
            startPaddleY = rightPaddleY;
        });

        canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            if (isTouching) {
                const rect = canvas.getBoundingClientRect();
                const currentTouchY = e.touches[0].clientY - rect.top;
                const deltaY = currentTouchY - startTouchY;
                rightPaddleY = startPaddleY + deltaY;
                if (rightPaddleY < 0) rightPaddleY = 0;
                if (rightPaddleY > canvas.height - paddleHeight) rightPaddleY = canvas.height - paddleHeight;
            }
        });

        canvas.addEventListener('touchend', (e) => {
            e.preventDefault();
            isTouching = false;
        });

        function update() {
            // Movimentar raquete esquerda (IA)
            const targetY = ballY - paddleHeight / 2;
            if (leftPaddleY < targetY) {
                leftPaddleY += Math.min(aiSpeed, targetY - leftPaddleY);
            } else if (leftPaddleY > targetY) {
                leftPaddleY -= Math.min(aiSpeed, leftPaddleY - targetY);
            }
            if (leftPaddleY < 0) leftPaddleY = 0;
            if (leftPaddleY > canvas.height - paddleHeight) leftPaddleY = canvas.height - paddleHeight;

            // Movimentar raquete direita (jogador)
            if (keys['ArrowUp'] && rightPaddleY > 0) rightPaddleY -= paddleSpeed;
            if (keys['ArrowDown'] && rightPaddleY < canvas.height - paddleHeight) rightPaddleY += paddleSpeed;

            // Movimentar bola
            ballX += ballDX;
            ballY += ballDY;

            // Colisão com paredes superior/inferior
            if (ballY <= 0 || ballY >= canvas.height - ballSize) {
                ballDY = -ballDY;
            }

            // Colisão com raquetes
            if (ballX <= paddleWidth && ballY + ballSize >= leftPaddleY && ballY <= leftPaddleY + paddleHeight) {
                ballDX = -ballDX;
                ballDY += (ballY - (leftPaddleY + paddleHeight / 2)) * 0.1; // Ângulo baseado na posição
            }
            if (ballX >= canvas.width - paddleWidth - ballSize && ballY + ballSize >= rightPaddleY && ballY <= rightPaddleY + paddleHeight) {
                ballDX = -ballDX;
                ballDY += (ballY - (rightPaddleY + paddleHeight / 2)) * 0.1; // Ângulo baseado na posição
            }

            // Pontuação e reset da bola
            if (ballX < 0) {
                rightScore++;
                resetBall();
            }
            if (ballX > canvas.width - ballSize) {
                leftScore++;
                resetBall();
            }

            scoreElement.textContent = `Pontuação IA - Jogador: ${leftScore} - ${rightScore}`;
        }

        function resetBall() {
            ballX = canvas.width / 2;
            ballY = canvas.height / 2;
            ballDX = ballSpeed * (Math.random() > 0.5 ? 1 : -1);
            ballDY = ballSpeed * (Math.random() > 0.5 ? 1 : -1);
        }

        function draw() {
            // Limpar canvas
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Desenhar raquetes com glow
            ctx.shadowColor = '#00ffcc';
            ctx.shadowBlur = 10;
            ctx.fillStyle = '#00ffcc';
            ctx.fillRect(0, leftPaddleY, paddleWidth, paddleHeight);
            ctx.fillRect(canvas.width - paddleWidth, rightPaddleY, paddleWidth, paddleHeight);

            // Desenhar bola com glow
            ctx.beginPath();
            ctx.arc(ballX + ballSize / 2, ballY + ballSize / 2, ballSize / 2, 0, Math.PI * 2);
            ctx.fill();

            // Linha central
            ctx.strokeStyle = '#00ffcc';
            ctx.setLineDash([5, 15]);
            ctx.beginPath();
            ctx.moveTo(canvas.width / 2, 0);
            ctx.lineTo(canvas.width / 2, canvas.height);
            ctx.stroke();
        }

        function gameLoop() {
            update();
            draw();
            requestAnimationFrame(gameLoop);
        }

        gameLoop();
    </script>
</body>
</html>
