const telaInicial = document.getElementById('start-screen');
const telaJogo = document.getElementById('game-screen');
const telaFimJogo = document.getElementById('game-over-screen');
const telaInfo = document.getElementById('info-screen');
const botaoIniciar = document.getElementById('start-button');
const botaoReiniciar = document.getElementById('restart-button');
const botaoInfo = document.getElementById('info-button');
const botaoInfoFimJogo = document.getElementById('game-over-info-button');
const botaoVoltar = document.getElementById('back-button');
const botaoInfoJogo = document.getElementById('in-game-info-button');
const elementoPontuacao = document.getElementById('score');
const elementoPontuacaoFinal = document.getElementById('final-score');
const ElementoRecorde = document.getElementById('high-score');
const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');

// cotrole mobile
const controleEsquerda = document.getElementById('left-control');
const controlePulo = document.getElementById('jump-control');
const controleDireita = document.getElementById('right-control');

// powerups
const indicadorPimentaExplosiva = document.getElementById('chilli-explosion');
const indicadorCarneAco = document.getElementById('steel-meat');
const magicPotIndicator = document.getElementById('magic-pot');

// imagens
const imagemPiso = new Image();
imagemPiso.src = 'images/piso.png';

const ImagemFogao = new Image();
ImagemFogao.src = 'images/fogao.png';

const imagemTomate = new Image();
imagemTomate.src = 'images/tomate.png';

const ImagemPimenta = new Image();
ImagemPimenta.src = 'images/Pimenta.png';

const imagemOvo = new Image();
imagemOvo.src = 'images/ovo.png';

const imagemFaca = new Image();
imagemFaca.src = 'images/facão.png';

const imagemParede = new Image();
imagemParede.src = 'images/parede-tijolo.png';

const imagemMolhoRapido = new Image();
imagemMolhoRapido.src = 'images/azul.png'; // imagem temporarea

const imagemMolhoLento = new Image();
imagemMolhoLento.src = 'images/tomate.png'; // imagem temporarea

// configuraçães do jogo
let larguraJogo, alturaJogo, nivelChao;
let pontuacao = 0;
let recorde = localStorage.getItem('highScore') || 0;
let velocidadeJogo = 5;
let gravidade = 0.5;
let jogoRodando = false;
let idAnimacao;
let tempoAnterior = 0;
let deltaTime = 0;
let temporizadorObstaculo = 0;
let temporizadorPowerUp = 0;
let temporizadorDificuldade = 0;
let temporizadorPontuacao = 0; 
let teclaEsquerdaPressionada = false;
let teclaDireitaPressionada = false;
let jogoPausado = false;
let alturaPiso = 200; 
let fatorEscala = 1.3;
let deslocamentoParede = 0;
let deslocamentoPiso = 0;

const framesJogador = [];
const totalFrames = 8;
const larguraFrameOriginal = 288;
const alturaFrameOriginal = 456;

const larguraFrameEscalado = 50 * fatorEscala;
const alturaFrameEscalado = 50 * fatorEscala;

for (let i = 0; i < totalFrames; i++) {
    const frame = new Image();
    frame.src = `images/personagem/frame_${i}_delay-0.1s.gif`;
    framesJogador.push(frame);
}

// Controle de animação
let frameAtual = 0;
let tempoDesdeUltimoFrame = 0;
const intervaloEntreFrames = 100; 

const jogador = {
    x: 0,
    y: 0,
    width: larguraFrameEscalado,
    height: alturaFrameEscalado,
    velocityY: 0,
    velocityX: 0,
    forcaPulo: -12,
    pulando: false,
    velocidadeMovimento: 5,
    imune: false,
    gigante: false,
    widthOriginal: 80 * fatorEscala,
    heightOriginal: 200 * fatorEscala,
    hitboxOffsetX: 10,
    hitboxOffsetY: 5,
    tempoImunidadeGigante: 0,

    draw(timestamp) {
        // efeito visual
        if (this.imune) {
            ctx.shadowColor = '#ffd700';
            ctx.shadowBlur = 10;
        }

        if (this.gigante) {
            ctx.shadowColor = '#ff4500';
            ctx.shadowBlur = 15;
        }

        // Controle de tempo para mudar frame
        if (timestamp - tempoDesdeUltimoFrame > intervaloEntreFrames) {
            frameAtual = (frameAtual + 1) % totalFrames;
            tempoDesdeUltimoFrame = timestamp;
        }

        const frameImagem = framesJogador[frameAtual];
        ctx.drawImage(
            frameImagem,
            this.x,
            this.y,
            this.width,
            this.height
        );

        // Reseta sombra
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
    },

    update() {
        this.velocityY += gravidade;
        this.y += this.velocityY;

        if (this.y + this.height > nivelChao - alturaPiso / 2) {
            this.y = nivelChao - alturaPiso / 2 - this.height;
            this.velocityY = 0;
            this.pulando = false;
        }

        if (teclaEsquerdaPressionada && !teclaDireitaPressionada) {
            this.velocityX = -this.velocidadeMovimento;
        } else if (teclaDireitaPressionada && !teclaEsquerdaPressionada) {
            this.velocityX = this.velocidadeMovimento;
        } else if (teclaEsquerdaPressionada && teclaDireitaPressionada) {
            this.velocityX = (ultimaTeclaPressionada === 'left') ? -this.velocidadeMovimento : this.velocidadeMovimento;
        } else {
            this.velocityX = 0;
        }

        this.x += this.velocityX;

        if (this.x < 0) {
            this.x = 0;
        }
        if (this.x + this.width > larguraJogo) {
            this.x = larguraJogo - this.width;
        }
        if (this.tempoImunidadeGigante > 0) {
            this.tempoImunidadeGigante -= deltaTime;
            if (this.tempoImunidadeGigante <= 0) {
                this.tempoImunidadeGigante = 0;
            }
        }
    },

    pular() {
        if (!this.pulando) {
            this.velocityY = this.forcaPulo;
            this.pulando = true;
        }
    },

    moverEsquerda() {
        teclaEsquerdaPressionada = true;
        ultimaTeclaPressionada = 'left';
    },

    moverDireita() {
        teclaDireitaPressionada = true;
        ultimaTeclaPressionada = 'right';
    },

    pararMoverEsquerda() {
        teclaEsquerdaPressionada = false;
    },

    pararMoverDireita() {
        teclaDireitaPressionada = false;
    },

    crescer() {
        this.width = this.widthOriginal * fatorEscala;
        this.height = this.heightOriginal * fatorEscala;
        this.gigante = true;
        this.tempoImunidadeGigante = 50000; 
        this.imune = true;
    },

    encolher() {
        this.width = this.widthOriginal;
        this.height = this.heightOriginal;
        this.gigante = false;
        if (this.tempoImunidadeGigante > 0) {
            this.imune = false;
            this.tempoImunidadeGigante = 0;
        }
    },

    reset() {
        this.x = larguraJogo * 0.2;
        this.y = nivelChao - alturaPiso / 2 - this.height;
        this.velocityY = 0;
        this.velocityX = 0;
        this.pulando = false;
        this.imune = false;
        this.gigante = false;
        this.width = this.widthOriginal;
        this.height = this.heightOriginal;
        this.tempoImunidadeGigante = 0;
        teclaEsquerdaPressionada = false;
        teclaDireitaPressionada = false;
    }
};

let obstaculos = [];
let powerUps = [];
let superficiesMolho = [];
let explosoes = [];
let ultimaTeclaPressionada = null;

class Obstaculo {
    constructor(type) {
        this.type = type;
        this.width = 40 * fatorEscala;
        this.height = 40 * fatorEscala;
        this.x = larguraJogo;
        this.velocidade = velocidadeJogo;
        this.active = true;
        
        switch(type) {
            case 'flyingPan':
                this.y = nivelChao - alturaPiso/2 - this.height - Math.random() * 200;
                this.width = 80 * fatorEscala;
                this.height = 20 * fatorEscala;
                this.subindo = Math.random() > 0.5;
                this.velocidadeVertical = 2 + Math.random() * 2;
                this.minHeight = nivelChao - 250;
                this.maxHeight = nivelChao - alturaPiso/2 - this.height;
                break;
                
            case 'tomato':
                this.y = -this.height;
                this.x = Math.random() * (larguraJogo - this.width);
                this.velocidade = 0;
                this.velocidadeQueda = 3 + Math.random() * 3;
                break;
                
            case 'pepper':
                this.y = -this.height;
                this.x = Math.random() * (larguraJogo - this.width);
                this.velocidade = 0;
                this.velocidadeQueda = 4 + Math.random() * 4;
                this.anguloRotacao = 0;
                this.velocidadeRotacao = 0.05 + Math.random() * 0.1;
                break;
                
            case 'egg':
                this.y = -this.height;
                this.x = Math.random() * (larguraJogo - this.width);
                this.velocidade = 0;
                this.velocidadeQueda = 5 + Math.random() * 2;
                this.quantidadeOscilacao = 30 + Math.random() * 4; 
                this.velocidadeOscilacao = 0.001 + Math.random() * 0.0002; 
                this.posicaoOscilacao = 0;
                this.direcaoAleatoria = Math.random() > 0.5 ? 1 : -1; // imprevisibilidade
                this.mudancaDirecaoTimer = 0;
                this.intervaloMudancaDirecao = 500 + Math.random() * 10000; 
                break;
                
            case 'stove':
                this.y = nivelChao - alturaPiso/2 - this.height -50; 
                this.width = 100 * fatorEscala;
                this.height = 90 * fatorEscala;
                break;
                
            default:
                this.y = nivelChao - alturaPiso/2 - this.height; 
        }
    }
    
    draw() {
        ctx.save();
        
        switch(this.type) {
            case 'flyingPan':
                ctx.drawImage(imagemFaca, this.x, this.y, this.width, this.height);
                break;
                
            case 'tomato':
                ctx.drawImage(imagemTomate, this.x, this.y, this.width, this.height);
                break;
                
            case 'pepper':
                // Rotaciona a pimenta
                ctx.translate(this.x + this.width/2, this.y + this.height/2);
                ctx.rotate(this.anguloRotacao);
                ctx.translate(-(this.x + this.width/2), -(this.y + this.height/2));
                
                ctx.drawImage(ImagemPimenta, this.x, this.y, this.width, this.height);
                break;
                
            case 'egg':
                ctx.drawImage(imagemOvo, this.x, this.y, this.width, this.height);
                break;
                
            case 'stove':
                ctx.drawImage(ImagemFogao, this.x, this.y, this.width, this.height);
                break;
                
            default:
                ctx.fillStyle = '#ff0000';
                ctx.fillRect(this.x, this.y, this.width, this.height);
        }
        
        ctx.restore();
    }
    
    update() {
        switch(this.type) {
            case 'flyingPan':
                this.x -= this.velocidade;
        
                if (this.subindo) {
                    this.y -= this.velocidadeVertical;
                    if (this.y <= this.minHeight) {
                        this.subindo = false;
                    }
                } else {
                    this.y += this.velocidadeVertical;
                    if (this.y >= this.maxHeight) {
                        this.subindo = true;
                    }
                }
                break;
                
            case 'tomato':
                this.y += this.velocidadeQueda;
                
                if (this.y > alturaJogo) {
                    this.active = false;
                }
                break;
                
            case 'pepper':
                this.y += this.velocidadeQueda;
                this.anguloRotacao += this.velocidadeRotacao;
                
                if (this.y > alturaJogo) {
                    this.active = false;
                }
                break;
                
            case 'egg':
                this.y += this.velocidadeQueda;
                
                this.posicaoOscilacao += this.velocidadeOscilacao;
                this.mudancaDirecaoTimer += deltaTime;
                
                // muda a direção aleatoriamente em intervalos
                if (this.mudancaDirecaoTimer > this.intervaloMudancaDirecao) {
                    this.direcaoAleatoria = -this.direcaoAleatoria; 
                    this.velocidadeOscilacao = 0.2 + Math.random() * 0.3; 
                    this.quantidadeOscilacao = 3 + Math.random() * 4; 
                    this.mudancaDirecaoTimer = 0;
                    this.intervaloMudancaDirecao = 300 + Math.random() * 700; 
                }
                
                // movimento lateral com base na oscilação e direção
                const deslocamentoX = Math.sin(this.posicaoOscilacao) * this.quantidadeOscilacao * this.direcaoAleatoria;
                this.x += deslocamentoX;
                
                // movimento extra aleatório ocasional
                if (Math.random() < 0.05) {
                    this.x += (Math.random() - 0.5) * 10;
                }
                
                // deixa dentro da tela
                if (this.x < 0) this.x = 0;
                if (this.x + this.width > larguraJogo) this.x = larguraJogo - this.width;
                
                if (this.y > alturaJogo) {
                    this.active = false;
                }
                break;
                
            case 'stove':
                this.x -= this.velocidade;
                
                if (this.x + this.width < 0) {
                    this.active = false;
                }
                break;
                
            default:
                this.x -= this.velocidade;
                
                if (this.x + this.width < 0) {
                    this.active = false;
                }
        }
    }
    
    chacarColisao(jogador) {
        return (
            jogador.x < this.x + this.width &&
            jogador.x + jogador.width > this.x &&
            jogador.y < this.y + this.height &&
            jogador.y + jogador.height > this.y
        );
    }
}

class SuperficiaMolho {
    constructor(tipo = null) {
        this.width = (100 + Math.random() * 100) * fatorEscala;
        this.height = 10 * fatorEscala;
        this.x = larguraJogo;
        this.y = nivelChao - alturaPiso/2; 
        this.velocidade = velocidadeJogo;
        this.active = true;
        
        // define o tipo de molho
        this.tipo = tipo || (Math.random() < 0.5 ? 'rapido' : 'lento');
        
        if (this.tipo === 'rapido') {
            this.color = 'rgba(0, 0, 255, 0.7)'; // azul para molho rápido
        } else {
            this.color = 'rgba(255, 0, 0, 0.7)'; // vermelho para molho lento
        }
    }
    
    draw() {
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.ellipse(this.x + this.width/2, this.y + this.height/2, this.width/2, this.height, 0, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.beginPath();
        ctx.ellipse(this.x + this.width/3, this.y + this.height/2, this.width/6, this.height/8, 0, 0, Math.PI * 2);
        ctx.fill();
        
        if (this.tipo === 'rapido') {
            // setas para indicar velocidade
            ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
            ctx.beginPath();
            ctx.moveTo(this.x + this.width/2 - 15, this.y);
            ctx.lineTo(this.x + this.width/2 + 15, this.y);
            ctx.lineTo(this.x + this.width/2, this.y - 10);
            ctx.fill();
        } else {
            // simbolo para indicar lentidão
            ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
            ctx.beginPath();
            ctx.arc(this.x + this.width/2, this.y, 5, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    
    update() {
        this.x -= this.velocidade;
        
        // destroi quando sai da tela
        if (this.x + this.width < 0) {
            this.active = false;
        }
    }
    
    checkCollision(jogador) {
        if (
            jogador.x < this.x + this.width &&
            jogador.x + jogador.width > this.x &&
            jogador.y + jogador.height >= this.y &&
            jogador.y + jogador.height <= this.y + this.height + 5
        ) {
            return true;
        }
        return false;
    }
}

class PowerUp {
    constructor(tipo) {
        this.type = tipo;
        this.width = 30 * fatorEscala;
        this.height = 30 * fatorEscala;
        this.x = larguraJogo;
        this.y = nivelChao - alturaPiso/2 - this.height - 50 - Math.random() * 150; 
        this.velocidade = velocidadeJogo;
        this.active = true;
        this.floatOffset = 0;
        this.floatSpeed = 0.05;
        this.floatAmount = 5;
        this.anguloRotacao = 0;
        this.velocidadeRotacao = 0.02;
        
        // Ajustes específicos por tipo
        switch(tipo) {
            case 'chilliExplosion':
                this.color = '#ff4500';
                break;
            case 'steelMeat':
                this.color = '#cd853f';
                break;
            case 'magicPot':
                this.color = '#9932cc';
                break;
        }
    }
    
    draw() {
        ctx.save();
        
        // rotação
        ctx.translate(this.x + this.width/2, this.y + this.height/2);
        ctx.rotate(this.anguloRotacao);
        ctx.translate(-(this.x + this.width/2), -(this.y + this.height/2));
        
        // brilho
        ctx.shadowColor = this.color;
        ctx.shadowBlur = 10;
        
        switch(this.type) {
            case 'chilliExplosion':
                ctx.drawImage(ImagemPimenta, this.x, this.y, this.width, this.height);
                break;
                
            case 'steelMeat':
                ctx.drawImage(imagemFaca, this.x, this.y, this.width, this.height);
                break;
                
            case 'magicPot':
                ctx.fillStyle = '#9932cc';
                ctx.beginPath();
                ctx.arc(this.x + this.width/2, this.y + this.height/2, this.width/2, 0, Math.PI * 2);
                ctx.fill();
                
                ctx.strokeStyle = '#dda0dd';
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.arc(this.x + this.width/2, this.y + this.height/2, this.width/2 + 5, Math.PI * 0.8, Math.PI * 2.2);
                ctx.stroke();
                
                ctx.fillStyle = '#ffffff';
                ctx.globalAlpha = 0.6;
                ctx.beginPath();
                ctx.arc(this.x + this.width/2, this.y + this.height/3, this.width/6, 0, Math.PI * 2);
                ctx.fill();
                ctx.globalAlpha = 1;
                break;
        }
        
        ctx.restore();
    }
    
    update() {
        this.x -= this.velocidade;
        
        // Efeito de flutuação
        this.floatOffset += this.floatSpeed;
        this.y += Math.sin(this.floatOffset) * 0.5;
        
        //efeito de rotação
        this.anguloRotacao += this.velocidadeRotacao;
        
        // destroi quando sai da tela
        if (this.x + this.width < 0) {
            this.active = false;
        }
    }
    
    checkCollision(player) {
        if (
            player.x < this.x + this.width &&
            player.x + player.width > this.x &&
            player.y < this.y + this.height &&
            player.y + player.height > this.y
        ) {
            return true;
        }
        return false;
    }
}

class Explosion {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.radius = 5 * fatorEscala;
        this.maxRadius = 40 * fatorEscala;
        this.speed = 2;
        this.active = true;
        this.alpha = 1;
    }
    
    draw() {
        ctx.save();
        ctx.globalAlpha = this.alpha;
        
        // Círculo externo
        ctx.fillStyle = '#ff4500';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
        
        // Círculo interno 
        ctx.fillStyle = '#ffff00';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius * 0.6, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
    }
    
    update() {
        this.radius += this.speed;
        this.alpha -= 0.02;
        
        if (this.radius >= this.maxRadius || this.alpha <= 0) {
            this.active = false;
        }
    }
    
    checkCollision(obstacle) {
        // Verificar se a explosão atinge um obstáculo
        const dx = obstacle.x + obstacle.width/2 - this.x;
        const dy = obstacle.y + obstacle.height/2 - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < this.radius + Math.max(obstacle.width, obstacle.height)/2) {
            return true;
        }
        return false;
    }
}

const powerUpsAtivos = {
    chilliExplosion: {
        active: false,
        duracao: 0,
        duracaoMaxima: 5000,
        activate() {
            this.active = true;
            this.duracao = this.duracaoMaxima;
            indicadorPimentaExplosiva.classList.add('active');
            
            try {
                createExplosion(jogador.x + jogador.width/2, jogador.y + jogador.height/2);
            } catch (error) {
                console.error("Erro ao criar explosão:", error);
            }
        },
        update(deltaTime) {
            if (this.active) {
                this.duracao -= deltaTime;
                
                const progress = this.duracao / this.duracaoMaxima;
                indicadorPimentaExplosiva.querySelector('.powerup-timer').style.transform = `scaleX(${progress})`;
                
                if (this.duracao <= 0) {
                    this.deactivate();
                }
            }
        },
        deactivate() {
            this.active = false;
            indicadorPimentaExplosiva.classList.remove('active');
            indicadorPimentaExplosiva.querySelector('.powerup-timer').style.transform = 'scaleX(0)';
        }
    },
    steelMeat: {
        active: false,
        duration: 0,
        maxDuration: 8000, 
        activate() {
            this.active = true;
            this.duration = this.maxDuration;
            jogador.imune = true;
            indicadorCarneAco.classList.add('active');
        },
        update(deltaTime) {
            if (this.active) {
                this.duration -= deltaTime;
                
                const progress = this.duration / this.maxDuration;
                indicadorCarneAco.querySelector('.powerup-timer').style.transform = `scaleX(${progress})`;
                
                if (this.duration <= 0) {
                    this.deactivate();
                }
            }
        },
        deactivate() {
            this.active = false;
            jogador.imune = false;
            indicadorCarneAco.classList.remove('active');
            indicadorCarneAco.querySelector('.powerup-timer').style.transform = 'scaleX(0)';
        }
    },
    magicPot: {
        active: false,
        duration: 0,
        maxDuration: 6000, 
        activate() {
            this.active = true;
            this.duration = this.maxDuration;
            jogador.crescer();
            magicPotIndicator.classList.add('active');
        },
        update(deltaTime) {
            if (this.active) {
                this.duration -= deltaTime;
                
                const progress = this.duration / this.maxDuration;
                magicPotIndicator.querySelector('.powerup-timer').style.transform = `scaleX(${progress})`;
                
                if (this.duration <= 0) {
                    this.deactivate();
                }
            }
        },
        deactivate() {
            this.active = false;
            jogador.encolher();
            magicPotIndicator.classList.remove('active');
            magicPotIndicator.querySelector('.powerup-timer').style.transform = 'scaleX(0)';
        }
    }
};


function createExplosion(x, y) {
    explosoes.push(new Explosion(x, y));
}

function redimensionarCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    larguraJogo = canvas.width;
    alturaJogo = canvas.height;
    nivelChao = alturaJogo; 
    
    alturaPiso = 200 * fatorEscala;
    
    if (jogoRodando) {
        jogador.y = nivelChao - alturaPiso/2 - jogador.height;
    }
}

function gerarObstaculos() {
    const tiposObstaculos = ['flyingPan', 'tomato', 'pepper', 'egg', 'stove'];
    
    const probabilidades = {
        'flyingPan': 0.10,
        'tomato': 0.10,
        'pepper': 0.10,
        'egg': 0.10,
        'stove': 0.60  
    };
    
    const random = Math.random();
    let acumuladaProbabilidade = 0;
    let tipoSelecionado = tiposObstaculos[0];
    
    for (const type of tiposObstaculos) {
        acumuladaProbabilidade += probabilidades[type];
        if (random < acumuladaProbabilidade) {
            tipoSelecionado = type;
            break;
        }
    }
    
    obstaculos.push(new Obstaculo(tipoSelecionado));
}

function gerarSuperficiaMolho() {
    const distanciaMinima = 300; 
    
    const temObstaculoProximo = obstaculos.some(obstaculo => 
        obstaculo.x > larguraJogo - distanciaMinima && 
        obstaculo.x < larguraJogo + distanciaMinima
    );
    
    const temMolhoProximo = superficiesMolho.some(molho => 
        molho.x > larguraJogo - distanciaMinima && 
        molho.x < larguraJogo + distanciaMinima
    );
    
    // gera molho se nao tiver nada perto
    if (!temObstaculoProximo && !temMolhoProximo) {
        const tipo = Math.random() < 0.5 ? 'rapido' : 'lento';
        superficiesMolho.push(new SuperficiaMolho(tipo));
    }
}

function gerarPowerUp() {
    const powerUpTipos = ['chilliExplosion', 'steelMeat', 'magicPot'];
    const tipoAleatorio = powerUpTipos[Math.floor(Math.random() * powerUpTipos.length)];
    powerUps.push(new PowerUp(tipoAleatorio));
}

function atualizacaoPontuacao() {
    pontuacao += 1;
    elementoPontuacao.textContent = pontuacao;
}

function verificarColisoes() {
    for (let obstaculo of obstaculos) {
        if (!obstaculo.active) continue;
        
        let colisao = false;
        
        if (obstaculo.type === 'stove') {
            // hitbox menor para fogão
            const margemX = obstaculo.width * 0.20;         
            const margemY = obstaculo.height * 0.2; 
            
            colisao = (
                jogador.x + jogador.hitboxOffsetX < obstaculo.x + obstaculo.width - margemX &&
                jogador.x + jogador.width - jogador.hitboxOffsetX > obstaculo.x + margemX &&
                jogador.y + jogador.hitboxOffsetY < obstaculo.y + obstaculo.height - margemY &&
                jogador.y + jogador.height - jogador.hitboxOffsetY > obstaculo.y + margemY
            );
        } else {
            colisao = (
                jogador.x + jogador.hitboxOffsetX < obstaculo.x + obstaculo.width &&
                jogador.x + jogador.width - jogador.hitboxOffsetX > obstaculo.x &&
                jogador.y + jogador.hitboxOffsetY < obstaculo.y + obstaculo.height &&
                jogador.y + jogador.height - jogador.hitboxOffsetY > obstaculo.y
            );
        }
        
        if (colisao) {
            // Se o jogador colidir com o fogão e estiver gigante, destruia o fogão
            if (obstaculo.type === 'stove' && jogador.gigante) {
                obstaculo.active = false;
                continue;
            }
            
            // Se o jogador colidir com o fogão e não estiver gigante, verificar se está imune
            if (obstaculo.type === 'stove') {
                if (!jogador.imune) {
                    fimJogo();
                    return;
                }
                continue;
            }
            
            if (!jogador.imune) {
                fimJogo();
                return;
            }
        }
    }
    
    for (let powerUp of powerUps) {
        if (powerUp.active && powerUp.checkCollision(jogador)) {
            powerUpsAtivos[powerUp.type].activate();
            powerUp.active = false;
        }
    }
    
    for (let superficie of superficiesMolho) {
        if (superficie.active && superficie.checkCollision(jogador)) {
            if (superficie.tipo === 'rapido') {
                if (jogador.velocityX === 0) {
                    // escorre na direcao do jogo se nao tiver se movemendo
                    jogador.velocityX = -velocidadeJogo * 29;
                } else {
                    // aumenta velocidade na direção onde tiver se movendo
                    jogador.velocityX *= 29;
                }
                
                if (jogador.velocityX > 30) jogador.velocityX = 30;
                if (jogador.velocityX < -30) jogador.velocityX = -30;
                
                jogador.forcaPulo = -13; 
                
                setTimeout(() => {
                    jogador.forcaPulo = -12; 
                }, 2000);
            } else {
                // Molho lento
                jogador.velocityX = jogador.velocityX > 0 ? 0.5 : -0.5;
                
                jogador.forcaPulo = -9; 
                
                setTimeout(() => {
                    jogador.forcaPulo = -12; //
                }, 500);
            }
        }
    }
}

function limparObjetosInativos() {
    obstaculos = obstaculos.filter(obstacle => obstacle.active);
    powerUps = powerUps.filter(powerUp => powerUp.active);
    superficiesMolho = superficiesMolho.filter(slide => slide.active);
    explosoes = explosoes.filter(explosion => explosion.active);
}

function drawBackground() {
    const brickPattern = ctx.createPattern(imagemParede, 'repeat');
    ctx.fillStyle = brickPattern;
    
    ctx.save();
    
    ctx.translate(deslocamentoParede, 0);
    ctx.fillRect(-imagemParede.width, 0, larguraJogo + imagemParede.width * 2, nivelChao - 100);
    
    ctx.restore();
    
    deslocamentoParede -= velocidadeJogo * 0.2;
    
    // reinicia o deslocamento para criar um loop
    if (deslocamentoParede <= -imagemParede.width) {
        deslocamentoParede = 0;
    }
    
    ctx.save();
    
    ctx.translate(deslocamentoPiso, 0);
    
    for (let x = -imagemPiso.width; x < larguraJogo + imagemPiso.width; x += imagemPiso.width) {
        ctx.drawImage(imagemPiso, x, nivelChao - alturaPiso, imagemPiso.width, alturaPiso);
    }
    
    ctx.restore();
    
    deslocamentoPiso -= velocidadeJogo * 0.5;
    if (deslocamentoPiso <= -imagemPiso.width) {
        deslocamentoPiso = 0;
    }
}

function atualizarJogo(timestamp) {
    if (!jogoRodando) return;
    
    if (!tempoAnterior) {
        tempoAnterior = timestamp;
    }
    deltaTime = timestamp - tempoAnterior;
    tempoAnterior = timestamp;
    
    ctx.clearRect(0, 0, larguraJogo, alturaJogo);
    
    drawBackground();
    
    jogador.update();
     if (jogador.tempoImunidadeGigante <= 0 && !powerUpsAtivos.steelMeat.active) {
        jogador.imune = false;
    }
    jogador.draw(timestamp);
    
    temporizadorObstaculo += deltaTime;
    if (temporizadorObstaculo > 1500 - velocidadeJogo * 50) {
        gerarObstaculos();
        temporizadorObstaculo = 0;
        
        if (Math.random() < 0.2) {
            gerarSuperficiaMolho();
        }
    }
    
    temporizadorPowerUp += deltaTime;
    if (temporizadorPowerUp > 5000) {
        if (Math.random() < 0.4) {
            gerarPowerUp();
        }
        temporizadorPowerUp = 0;
    }
    
    temporizadorDificuldade += deltaTime;
    if (temporizadorDificuldade > 10000) { 
        velocidadeJogo += 0.5;
        if (velocidadeJogo > 15) velocidadeJogo = 15; 
        temporizadorDificuldade = 0;
    }
    
    temporizadorPontuacao += deltaTime;
    if (temporizadorPontuacao > 100) {
        atualizacaoPontuacao();
        temporizadorPontuacao = 0;
    }
    
    for (let obstacle of obstaculos) {
        obstacle.update();
        obstacle.draw();
    }
    
    for (let powerUp of powerUps) {
        powerUp.update();
        powerUp.draw();
    }
    
    for (let slide of superficiesMolho) {
        slide.update();
        slide.draw();
    }
    
    for (let explosion of explosoes) {
        explosion.update();
        explosion.draw();
    }
    
    powerUpsAtivos.chilliExplosion.update(deltaTime);
    powerUpsAtivos.steelMeat.update(deltaTime);
    powerUpsAtivos.magicPot.update(deltaTime);
    
    verificarColisoes();
    
    limparObjetosInativos();
    
    idAnimacao = requestAnimationFrame(atualizarJogo);
}

function iniciarJogo() {
    telaInicial.classList.add('hidden');
    telaJogo.classList.remove('hidden');
    telaFimJogo.classList.add('hidden');
    
    pontuacao = 0;
    elementoPontuacao.textContent = pontuacao;
    velocidadeJogo = 5;
    jogoRodando = true;
    tempoAnterior = 0;
    
    obstaculos = [];
    powerUps = [];
    superficiesMolho = [];
    explosoes = [];
    deslocamentoParede = 0;
    deslocamentoPiso = 0;
    powerUpsAtivos.chilliExplosion.deactivate();
    powerUpsAtivos.steelMeat.deactivate();
    powerUpsAtivos.magicPot.deactivate();
    
    jogador.reset();

    idAnimacao = requestAnimationFrame(atualizarJogo);
}

function fimJogo() {
    jogoRodando = false;
    cancelAnimationFrame(idAnimacao);
    
    elementoPontuacaoFinal.textContent = pontuacao;
    
    if (pontuacao > recorde) {
        recorde = pontuacao;
        localStorage.setItem('highScore', recorde);
    }
    ElementoRecorde.textContent = recorde;
    
    telaFimJogo.classList.remove('hidden');
}

function retomarJogo() {
    if (!jogoRodando) return;
    
    jogoRodando = false;
    cancelAnimationFrame(idAnimacao);
}

function mostrarInfoJogo() {
    if (jogoRodando) return;
    
    jogoRodando = true;
    tempoAnterior = 0;
    idAnimacao = requestAnimationFrame(atualizarJogo);
}

function ocultarTelaInfo() {
    if (jogoRodando) {
        retomarJogo();
        jogoPausado = true;
    } else {
        jogoPausado = false;
    }
    
    telaInicial.classList.add('hidden');
    telaJogo.classList.add('hidden');
    telaFimJogo.classList.add('hidden');
    
    telaInfo.classList.remove('hidden');
}

function esconderTelaInfo() {
    telaInfo.classList.add('hidden');
    
    if (jogoPausado) {
        telaJogo.classList.remove('hidden');
        mostrarInfoJogo();
    } else if (telaFimJogo.classList.contains('hidden')) {
        telaInicial.classList.remove('hidden');
    } else {
        telaFimJogo.classList.remove('hidden');
    }
}

botaoInfo.addEventListener('click', ocultarTelaInfo);
botaoInfoFimJogo.addEventListener('click', ocultarTelaInfo);
botaoInfoJogo.addEventListener('click', ocultarTelaInfo);
botaoVoltar.addEventListener('click', esconderTelaInfo);

window.addEventListener('keydown', (e) => {
    if (!jogoRodando) return;
    
    switch (e.key) {
        case 'ArrowUp':
        case ' ':
            jogador.pular();
            break;
        case 'ArrowLeft':
            jogador.moverEsquerda();
            break;
        case 'ArrowRight':
            jogador.moverDireita();
            break;
    }
});

window.addEventListener('keyup', (e) => {
    if (!jogoRodando) return;
    
    switch (e.key) {
        case 'ArrowLeft':
            jogador.pararMoverEsquerda();
            break;
        case 'ArrowRight':
            jogador.pararMoverDireita();
            break;
    }
});

controleEsquerda.addEventListener('touchstart', () => {
    if (!jogoRodando) return;
    jogador.moverEsquerda();
    controleEsquerda.classList.add('active');
});

controleEsquerda.addEventListener('touchend', () => {
    if (!jogoRodando) return;
    jogador.pararMoverEsquerda();
    controleEsquerda.classList.remove('active');
});

controleDireita.addEventListener('touchstart', () => {
    if (!jogoRodando) return;
    jogador.moverDireita();
    controleDireita.classList.add('active');
});

controleDireita.addEventListener('touchend', () => {
    if (!jogoRodando) return;
    jogador.pararMoverDireita();
    controleDireita.classList.remove('active');
});

controlePulo.addEventListener('touchstart', () => {
    if (!jogoRodando) return;
    jogador.pular();
    controlePulo.classList.add('active');
});

controlePulo.addEventListener('touchend', () => {
    if (!jogoRodando) return;
    controlePulo.classList.remove('active');
});

botaoIniciar.addEventListener('click', iniciarJogo);
botaoReiniciar.addEventListener('click', iniciarJogo);

window.addEventListener('resize', redimensionarCanvas);

window.addEventListener('keydown', (e) => {
    if (e.key === 'i' || e.key === 'I') {
        if (telaInfo.classList.contains('hidden')) {
            ocultarTelaInfo();
        } else {
            esconderTelaInfo();
        }
    }
});

window.addEventListener('load', () => {
    redimensionarCanvas();
    ElementoRecorde.textContent = recorde;
});
