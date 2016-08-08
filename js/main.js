window.onload = function () {
	// Set the name of the hidden property and the change event for visibility
	var hidden, visibilityChange; 
	if (typeof document.hidden !== "undefined") {
	  hidden = "hidden";
	  visibilityChange = "visibilitychange";
	} else if (typeof document.mozHidden !== "undefined") {
	  hidden = "mozHidden";
	  visibilityChange = "mozvisibilitychange";
	} else if (typeof document.msHidden !== "undefined") {
	  hidden = "msHidden";
	  visibilityChange = "msvisibilitychange";
	} else if (typeof document.webkitHidden !== "undefined") {
	  hidden = "webkitHidden";
	  visibilityChange = "webkitvisibilitychange";
	}

	// Back key event listener
	document.addEventListener('tizenhwkey', function(e) {
	  if (e.keyName === "back") {
	      try {
	          tizen.application.getCurrentApplication().exit();
	      } catch (ignore) {}
	  }
	});

	// Visibility change event listener
	document.addEventListener(visibilityChange, function () {
	  if (document[hidden]){
	  	  pause = true;
	      document.removeEventListener('click', action);
	      document.removeEventListener('rotarydetent', move);
	  } else {
	      pause = false;
	      countP = 0;
	      document.addEventListener('click', action);
	      document.addEventListener('rotarydetent', move);
	  }
	}, false);
	// tap event
	document.addEventListener('click', action);
    
    // Setting up the canvas
    var canvas = document.getElementById('canvas'),
        ctx    = canvas.getContext('2d'),
        cH     = ctx.canvas.height = 360,
        cW     = ctx.canvas.width  = 360;

    //General sprite load
    var imgHeart = new Image();
    imgHeart.src = 'images/heart.png';
    var imgRefresh = new Image();
    imgRefresh.src = 'images/refresh.png';
    var imgFlag = new Image();
    imgFlag.src = 'images/flag.png';
    var imgTrafficLight = new Image();
    imgTrafficLight.src = 'images/traffic_icon.png';

    //Game
    var lives      = 4,
        count      = 0,
        pause      = false,
        countP     = 0,
        playing    = false,
        gameOver   = false,
    	starting = true,
        level = 1,
        levelFactor = 1.20;

    var record = localStorage.getItem("record");
    record = record === null ? 0 : record;
    
    //Player
    var player = new _player();
    // Blocks
    var blocks = createNBlocks(5);
    
    // Action
    function action(e) {
        e.preventDefault();
        if(gameOver) {
            if(e.type === 'click') {
                gameOver   = false;
                starting = true;
                playing = false;
                count = 0;
                lives = 4;
                level = 1;
                blocks = createNBlocks(5);
                document.removeEventListener('rotarydetent', move);
            } 
        } else if (starting) {
            if(e.type === 'click') {
                starting = false;
                playing = true;
                document.addEventListener('rotarydetent', move);
            }
        } else if (playing) {
            if(e.type === 'click') {
                playing = true;
                document.addEventListener('rotarydetent', move);
            }
        }
        
    }
    
    // Move
    function move(e) {
        if (pause || player.dead) {
        	return;
        }
        var newX;
        if (e.detail.direction === "CW") {  
            newX = player.x + 10;
            if (newX <= cW - player.width - 5 ) {
                player.changeX(newX);
            }
        } else {
        	newX = player.x - 10;
            if (newX >= 5 ) {
                player.changeX(newX);
            }            
        }
    }
    
    // Player
    function _player() {
        this.width = 16;
        this.height = 16;
        this.x = 5;
        this.y = cH/2 - this.height/2;
        this.dead = false;
        this.deadForFrames = 0;
        this.changeX = function(nx){
            this.x = nx;
        };
        this.changeY = function(ny){
            this.y = ny;
        };
        this.die = function() {
            this.dead = true;
            this.deadForFrames = 30;
            lives -= 1;
        };
        this.resurrect = function() {
            this.dead = false;
            this.x = 5;
            this.y = cH/2 - this.width/2;
        };
        this.respawn = function() {
        	this.dead = false;
            this.x = 5;
            this.y = cH/2 - this.width/2;
        };
        this.draw = function() {
            ctx.beginPath();
            ctx.shadowColor = 'black';
            ctx.shadowBlur = 10;
            ctx.arc(this.x+this.width/2, this.y+this.height/2, this.height/2, 0, 2 * Math.PI, false);
            ctx.fillStyle = 'green';
            ctx.fill();
        };
    }
    
    // Block
    function _block(direction) {
        this.width = 15;
        this.height = rand(20, 100);
        this.x = rand(player.width + 10,cW - player.width - 10 - 20,15);
        this.y = 0;
        this.speed = rand(0.5,3);
        this.direction = direction;
        this.draw = function() {
          	ctx.fillStyle = "#545454";
            ctx.shadowBlur=20;
            ctx.shadowColor="black";
            roundRect(this.x, this.y, this.width, this.height, 5, true);
            ctx.shadowBlur=0;
        }
        if(direction === "up") {
          this.y = cH + rand(5, 180);
        }
        else {
          this.y -= rand(5, 180);
        }
    }
    
    function createNBlocks(n) {
    	var returnArr = [];
        for(var i=0;i<n;++i) {
        	returnArr.push(new _block(randIndex(["up","down"])));
        }
        return returnArr;
    }
    
    function moveBlocks() {
	    if(player.dead) {
	    	return;
	    }
	  
	    var len = blocks.length;
	    for(var i=0;i < len;++i) {
	        if(blocks[i].direction === 'up') {
	            blocks[i].y -= blocks[i].speed;
	            if((blocks[i].y + blocks[i].height) < 0) {
	                blocks[i].y = cH + rand(5, 180);
	            }
	        }
	        else {
	            blocks[i].y += blocks[i].speed;
	            if(blocks[i].y > cH) {
	                blocks[i].y = 0;
	                blocks[i].y -= rand(5, 180);
	            }
	        } 
	    }
    }
    
    function checkCollision(){
        var px = player.x,
        	py = player.y,
        	pw = player.width,
        	ph = player.height;
        
        var len = blocks.length;
        for(var i=0;i < len;++i) {
            if(((px >= blocks[i].x) && (px <= (blocks[i].x + blocks[i].width))) && 
               ((py >= blocks[i].y) && py <= (blocks[i].y + blocks[i].height) )) {
                player.die();
            }  
            else if(((px+pw <= (blocks[i].x + blocks[i].width)) && (px+pw >= blocks[i].x)) && 
                ((py+ph <= (blocks[i].y + blocks[i].height)) && py+ph >= blocks[i].y)) {
                player.die();
            }  
        }
    }
	
    
    // Update
    function update() {
    	if (playing) {
    		if (player.dead) {
    			if (player.deadForFrames < 0) {
    				if (lives < 0) {
    					playing = false;
    					gameOver = true;
    					document.removeEventListener('rotarydetent',move);
    				} else {
    					player.resurrect();
    				}
    			} else {
    				player.deadForFrames -= 1;
    			}
    		} else {
	    		// collision
	    		checkCollision();
	    		
	    		// move blocks
	    		if (!player.dead) {
	    			moveBlocks();
		    		// Check if level completed
			    	if (player.x > cW - player.width - 10) {
			    		player.respawn();
			    		level += 1;
			    		blocks = [];
		                var n = Math.ceil(5 + (level*levelFactor));
		                blocks = createNBlocks(n);
			    	}
	    		}
	    		
    		}
    	}
    }
    
    // Draw
    function draw() {
        if (pause) {
            if (countP < 1) {
                countP = 1;
            }
        } else if (playing) {
            if (player.dead) {
                if (player.deadForFrames === 30) {
                    ctx.fillStyle = 'rgba(255,0,0,0.3)';
                    ctx.rect(0,0, cW,cH);
                    ctx.fill();
                }
            } else {
            	//Clear
                ctx.clearRect(0, 0, cW, cH);
                
                // Drawing safe areas
                ctx.shadowBlur=20;
                ctx.shadowColor="black";
                ctx.fillStyle = '#232323';
                ctx.fillRect(0,0,player.width + 10,cW);
                ctx.fillRect(cW - player.width - 10,0,cW,cW);
                ctx.shadowBlur=0;
                ctx.drawImage(
                        imgFlag,
                        cW - player.width - 8,
                        cH/2 - 10,
                        20,
                        20);
                
                // Drawing player
                player.draw();
                
                // Drawing blocks
        	    var len = blocks.length;
        	    for(var i=0;i < len;++i) {
        	    	blocks[i].draw();
        	    }
 
                // Draw HUD
                ctx.font = "18px Helvetica";
                ctx.fillStyle = "white";
                ctx.textAlign = "center";
                ctx.textBaseline = 'middle';
                ctx.fillText(TIZEN_L10N["level"] + " " + level, cW/2,cH/2 + 150);

                ctx.font = "12px Helvetica";
                ctx.fillStyle = "white";
                ctx.textBaseline = 'middle';
                ctx.textAlign = "center";
                ctx.fillText(TIZEN_L10N["record"] + ': '+record+'', cW/2,cH/2 - 150);

                var startX = 130;
                for (var i = 0; i < lives; i++) {
                    ctx.drawImage(
                        imgHeart,
                        startX,
                        40,
                        20,
                        20
                    );
                    startX += 25;
                } 
                
            }            
        } else if(starting) {
            //Clear
            ctx.clearRect(0, 0, cW, cH);

            ctx.font = "bold 25px Helvetica";
            ctx.fillStyle = "white";
            ctx.textAlign = "center";
            ctx.fillText(TIZEN_L10N["jaywalk"], cW/2,cH/2 - 125);

            ctx.font = "bold 18px Helvetica";
            ctx.fillStyle = "white";
            ctx.textAlign = "center";
            ctx.fillText(TIZEN_L10N["tap_to_play"], cW/2,cH/2 - 90);     
              
            ctx.font = "bold 18px Helvetica";
            ctx.fillStyle = "white";
            ctx.textAlign = "center";
            ctx.fillText(TIZEN_L10N["instructions"], cW/2,cH/2 + 90);
              
            ctx.font = "14px Helvetica";
            ctx.fillStyle = "white";
            ctx.textAlign = "center";
            wrapText(TIZEN_L10N["cross"], cW/2,cH/2 + 115, 220, 18);
            
            ctx.shadowBlur=20;
            ctx.shadowColor="black";
            ctx.drawImage(
                    imgTrafficLight,
                    cW/2 - 44,
                    cH/2 - 64,
                    88,
                    128
                );
            ctx.shadowBlur=0;
            
        } else if(count < 1) {
            count = 1;
            ctx.fillStyle = 'rgba(0,0,0,0.75)';
            ctx.rect(0,0, cW,cH);
            ctx.fill();

            ctx.font = "bold 25px Helvetica";
            ctx.fillStyle = "white";
            ctx.textAlign = "center";
            ctx.fillText("Game over",cW/2,cH/2 - 100);

            ctx.font = "18px Helvetica";
            ctx.fillStyle = "white";
            ctx.textAlign = "center";
            ctx.fillText(TIZEN_L10N["level"] +": "+ level, cW/2,cH/2 + 100);

            record = level > record ? level : record;
            localStorage.setItem("record", record);

            ctx.font = "18px Helvetica";
            ctx.fillStyle = "white";
            ctx.textAlign = "center";
            ctx.fillText(TIZEN_L10N["record"] + ": "+ record, cW/2,cH/2 + 125);

            ctx.drawImage(imgRefresh, cW/2 - 23, cH/2 - 23);
        }
    }
    
    function init() {
        ctx.save();
        draw();
        ctx.restore();
    	update();
        window.requestAnimationFrame(init);
    }

    init();
    
    // Utils -----------------------
    function rand(min, max, interval) {
        if(interval === undefined) {
      	  interval = 1;
        }
        return Math.round((Math.floor(Math.random() * (max - min + 1)) + min) / interval) *interval;
      }

      function randIndex(thearray) {
        return thearray[rand(1, thearray.length) - 1];
      }
    
    function wrapText(text, x, y, maxWidth, lineHeight) {
        var words = text.split(' ');
        var line = '';

        for(var n = 0; n < words.length; n++) {
          var testLine = line + words[n] + ' ';
          var metrics = ctx.measureText(testLine);
          var testWidth = metrics.width;
          if (testWidth > maxWidth && n > 0) {
            ctx.fillText(line, x, y);
            line = words[n] + ' ';
            y += lineHeight;
          }
          else {
            line = testLine;
          }
        }
        ctx.fillText(line, x, y);
    }

    function roundRect(x, y, width, height, radius, fill, stroke) {
        if (typeof stroke === "undefined" ) {
          stroke = true;
        }
        if (typeof radius === "undefined") {
          radius = 5;
        }
        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + width - radius, y);
        ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
        ctx.lineTo(x + width, y + height - radius);
        ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        ctx.lineTo(x + radius, y + height);
        ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
        ctx.lineTo(x, y + radius);
        ctx.quadraticCurveTo(x, y, x + radius, y);
        ctx.closePath();
        if (stroke) {
          ctx.stroke();
        }
        if (fill) {
          ctx.fill();
        }        
    }
    
}