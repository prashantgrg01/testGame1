//Initialization of the quintus library after the window loads completely
window.addEventListener("load", function() {
    var Q = Quintus()
            .include("Scenes, Sprites, 2D, Input, Touch, UI, TMX, Audio")
            .setup({
                maximize: true
            })
            .controls().touch().enableSound();
    
    //Initialization of levels number which starts from 1 as level1
    var levelNum = 1;
    
    //Player class
    Q.Sprite.extend("Player", {
        init: function(p) {
            this._super(p, {
                sheet: "player",
                jumpSpeed: -550,
                speed: 200   
            });
            this.add("2d, platformerControls");
            this.on("jump", function() {
                if (!this.p.isJumping && this.p.vy < 0) {
                    this.p.isJumping = true;
                    Q.audio.play("jump.mp3");
                }
            });
            this.on("bump.bottom", function() {
                this.p.isJumping = false; 
            });
        }
    });
    
    //Flag class which signatures the completion of a level
    Q.Sprite.extend("Flag", {
        init: function(p) {
            this._super(p, {
                sheet: "flag"
            });
            this.add("2d");
            this.on("bump.top, bump.bottom, bump.left, bump.right", function(collision) {
                if (collision.obj.isA("Player")) {
                    Q("Player").destroy();
                    Q.audio.play("lc.mp3");
                    Q.stageScene("levelComplete", 1);
                }
            });
        }
    });
    
    //commonEnemy component
    Q.component("commonEnemy", {
        added: function() {
            this.entity.on("bump.left, bump.right, bump.bottom", function(collision) {
                if (collision.obj.isA("Player")) {
                    Q("Player").destroy();
                    Q.audio.play("die.mp3");
                    Q.stageScene("gameOver", 1);
                }
            });
            this.entity.on("bump.top", function(collision) {
                if (collision.obj.isA("Player")) {
                    collision.obj.p.vy = -100;
                    Q.audio.play("killEnemy.mp3");
                    this.destroy();
                }
            });
        }
    });
    
    //GroundEnemy class
    Q.Sprite.extend("GroundEnemy", {
        init: function(p) {
            this._super(p, {
                vx: -100,
                defaultDirection: "left"
            });
            this.add("2d, aiBounce, commonEnemy");
        },
        step: function(dt) {
            //Code for ground enemy AI to prevent them from falling from a platform
            var dirX = this.p.vx / Math.abs(this.p.vx);
            var ground = Q.stage().locate(this.p.x, this.p.y + this.p.h/2 + 1, Q.SPRITE_DEFAULT);
            var nextElement = Q.stage().locate(this.p.x + dirX * this.p.w/2 + dirX, this.p.y + this.p.h/2 + 1, Q.SPRITE_DEFAULT);
            var nextTile;
            
            if (nextElement instanceof Q.TileLayer) {
                nextTile = true;   
            }
            
            //Flipping the direction and their body
            if (!nextTile && ground) {                
                if (this.p.vx < 0) {
                    this.p.flip = "x";   
                } else {
                    this.p.flip = false;
                }
                
                this.p.vx = -this.p.vx;
            }
        }
    });
    
    //VerticalEnemy class
    Q.Sprite.extend("VerticalEnemy", {
        init: function(p) {
            this._super(p, {
                vy: -100,
                rangeY: 250,
                gravity: 0
            });
            this.add("2d, aiBounce, commonEnemy");
            
            this.p.initialY = this.p.y;
        },
        step: function(dt) {
            //Check range and change direction and set the new initialY
            if (Math.abs(this.p.y - this.p.initialY) >= this.p.rangeY) {
                this.p.vy = -this.p.vy;
                this.p.initialY = this.p.y;
            }
        }
    });
    
    //Define Scenes
    Q.scene("level1", function(stage) {
        var player;
        Q.stageTMX("level1.tmx", stage);
        
        player = Q("Player").first();
        stage.add("viewport").follow(player, {x: true, y: true});
        Q.audio.stop();
        Q.audio.play("randomSillyChip.mp3", {loop: true});
    });
    
    Q.scene("level2", function(stage) {
        var player;
        Q.stageTMX("level2.tmx", stage);
        
        player = Q("Player").first();
        stage.add("viewport").follow(player, {x: true, y: true});
        Q.audio.stop();
        Q.audio.play("randomSillyChip.mp3", {loop: true});
    });
    
    //Scene to display when each level completes
    Q.scene("levelComplete", function(stage) {
        var box = stage.insert(new Q.UI.Container({
            x: Q.width/2,
            y: Q.height/2 - 100,
            fill: "rgba(220,220,220,0.8)"
        }));
        var text = box.insert(new Q.UI.Text({
            x: 0,
            y: 0,
            label: "Level " + levelNum + " Complete!",
            family: "sans-serif",
            color: "yellow",
            size: 36,
            weight: "600"
        }));
        var playAgain = box.insert(new Q.UI.Button({
            x: -100,
            y: 100,
            fill: "cornflowerblue",
            label: "Play Again!"
        }));
        var nextLevel = box.insert(new Q.UI.Button({
            x: 100,
            y: 100,
            fill: "darkkhaki",
            label: "Next Level!"
        }));
        box.fit(40);
        
        playAgain.on("click", function() {
            Q.clearStages();
            Q.stageScene(("level"+levelNum).toString());
        });
        
        nextLevel.on("click", function() {
            if (levelNum < 2) {
                levelNum++;
                Q.clearStages();
                Q.stageScene(("level"+levelNum).toString());
            } else {
                Q.stageScene("gameComplete", 1);   
            }
        });
    });
    
    //Game over scene to display each time the player dies
    Q.scene("gameOver", function(stage) {
        var box = stage.insert(new Q.UI.Container({
            x: Q.width/2,
            y: Q.height/2 - 100,
            fill: "rgba(220,220,220,0.8)"
        }));
        var text = box.insert(new Q.UI.Text({
            x: 0,
            y: 0,
            label: "Game Over",
            family: "sans-serif",
            color: "#333",
            size: 36,
            weight: "600"
        }));
        var tryAgain = box.insert(new Q.UI.Button({
            x: 0,
            y: 100,
            fill: "darkkhaki",
            label: "Try Again!"
        }));
        box.fit(40);
        
        tryAgain.on("click", function() {
            Q.clearStages();
            Q.stageScene(("level"+levelNum).toString());
        });
    });
    
    //Final scene to diaplay when all the levels are completed
    Q.scene("gameComplete", function(stage) {
        var box = stage.insert(new Q.UI.Container({
            x: Q.width/2,
            y: Q.height/2 - 100,
            fill: "rgba(220,220,220,0.8)"
        }));
        var text = box.insert(new Q.UI.Text({
            x: 0,
            y: 0,
            label: "Congratulations! Game complete.",
            family: "sans-serif",
            color: "yellow",
            size: 36,
            weight: "600"
        }));
        var name = box.insert(new Q.UI.Text({
            x: 120,
            y: 80,
            label: "Test Game by Prashant",
            family: "sans-serif",
            color: "chocolate",
            size: 16,
            weight: "600"
        }));
        var info = box.insert(new Q.UI.Text({
            x: 50,
            y: 120,
            label: "(Now you might wanna restart the browser or keep staring at the completed game!)",
            family: "sans-serif",
            color: "cornflowerblue",
            size: 14,
            weight: "600"
        }));
        box.fit(40);
    });
    
    //Loading required assets
    Q.loadTMX("level1.tmx, level2.tmx, p1_front.png, p1_front.json, objects_spritesheet.png, objects_spritesheet.json, jump.mp3, killEnemy.mp3, lc.mp3, die.mp3, randomSillyChip.mp3", function() {
        Q.compileSheets("p1_front.png", "p1_front.json");
        Q.compileSheets("objects_spritesheet.png", "objects_spritesheet.json");
        Q.stageScene(("level"+levelNum).toString());
    });
    
});