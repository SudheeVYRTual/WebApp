import React, { useEffect, useRef } from "react";
import Phaser from "phaser";

// import "../styles/Bubblepop.css";
import bubble from "../assets/bubble.png";
import pop from "../assets/sounds/pop.mp3";
import infoIcon from "../assets/info.png";

const BubblesPopGame = () => {
    const gameRef = useRef(null);

    useEffect(() => {
        if (gameRef.current) return;

        class BubbleGame extends Phaser.Scene {
            constructor() {
                super("BubbleGame");
            }
            preload() {
                this.load.image("bubble", bubble);
                this.load.image("info-icon", infoIcon);
                this.load.audio("pop", pop);
            }
            create() {
                this.bubbles = this.physics.add.group();
                this.score = 0;
                // this.timer = 30;
                this.scoreText = this.add.text(20, 20, "Score: 0", { fontSize: "24px", fill: "#fff" });
                // this.timerText = this.add.text(20, 50, `Time: ${this.timer}s`, { fontSize: "24px", fill: "#fff" });

                const infoIcon = this.add.image(750, 50, "info-icon").setScale(1);
                infoIcon.setInteractive();
                infoIcon.on("pointerdown", () => {
                  this.openModal();
                });

                this.popSound = this.sound.add("pop");

                // this.time.addEvent({ delay: 1000, callback: this.updateTimer, callbackScope: this, loop: true });
                this.time.addEvent({ delay: 800, callback: this.spawnBubble, callbackScope: this, loop: true });
            }
            openModal() {
                this.physics.pause();
                this.bubbles.children.each((bubble) => {
                    bubble.disableInteractive();
                });
                const modal = this.add.container(400, 250);
                const modalBackground = this.add.rectangle(0, 0, 400, 350, 0xffffff); // Increased height to accommodate rules text
                modalBackground.setOrigin(0.5, 0.5);
                modal.add(modalBackground);
              
                const modalText = this.add.text(0, -150, "Game Rules:", { fontSize: "24px", fill: "#000" });
                modalText.setOrigin(0.5, 0.5);
                modal.add(modalText);
              
                const rulesText = this.add.text(0, -50, "Pop as many bubbles as you can.\nEach bubble is worth 10 points.", { fontSize: "18px", fill: "#000", align: "center", wordWrap: { width: 350 } }); // Added wordWrap to prevent overflow
                rulesText.setOrigin(0.5, 0.5);
                modal.add(rulesText);
              
                const closeButton = this.add.rectangle(0, 0, 200, 50, 0xff0000);
                closeButton.setOrigin(0.5, 0.5);
                const buttonTxt = this.add.text(0, 0, "Continue", { fontSize: "24px", fill: "#000" }); // Changed text to "Close" and positioned it inside the button
                buttonTxt.setOrigin(0.5, 0.5);
                const closeButtonContainer = this.add.container(0, 100);
                closeButtonContainer.add(closeButton);
                closeButtonContainer.add(buttonTxt);
                modal.add(closeButtonContainer);
              
                closeButton.setInteractive();
                closeButton.on("pointerdown", () => {
                    modal.destroy();
                    this.physics.resume();
                    this.bubbles.children.each((bubble) => {
                      bubble.enableInteractive();
                    });
                });
            }
            spawnBubble() {
                // if (this.timer <= 0) return;
                const x = Phaser.Math.Between(50, 750);
                const bubble = this.bubbles.create(x, 600, "bubble").setInteractive();
                bubble.setScale(0.1);
                bubble.setVelocityY(Phaser.Math.Between(-200, -100));
                bubble.on("pointerdown", () => this.popBubble(bubble));
            }
            popBubble(bubble) {
                // if (this.timer <= 0) return;
                this.popSound.play();
                bubble.destroy();
                this.score += 10;
                this.scoreText.setText(`Score: ${this.score}`);
            }
            updateTimer() {
                // if (this.timer>0){
                // this.timer--;
                // this.timerText.setText(`Time: ${this.timer}s`);
                // }
                // else if (this.timer <= 0) {
                this.physics.pause();
                this.add.text(300, 250, "Game Over", { fontSize: "32px", fill: "#fff" });
                this.bubbles.children.each((bubble) => {
                  bubble.disableInteractive();
                });
                const restartButton = this.add.rectangle(350, 300, 200, 50, 0xffffff);
                restartButton.setInteractive();
                const restartText = this.add.text(350, 300, "Restart", { fontSize: "24px", fill: "#000" });
                restartText.setOrigin(0.5, 0.5);
                restartButton.on("pointerdown", () => {
                  this.scene.restart();
                });
                    // }
            }
        }

        const config = {
          type: Phaser.AUTO,
          parent: "game-container",
          width: 800,
          height: 500,
          backgroundColor: "#87CEEB",
          physics: { default: "arcade" },
          scene: BubbleGame,
        };

        gameRef.current = new Phaser.Game(config);

        return () => {
            gameRef.current.destroy(true);
            gameRef.current = null;
        };
    }, []);

    return <div id="game-container"></div>;
};

export default BubblesPopGame;

