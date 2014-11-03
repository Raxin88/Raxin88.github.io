$(function() {
  var Q = window.Q = Quintus()
                     .include('Audio,Input,Sprites,Scenes,UI')
                     .setup();
  Q.enableSound();
  
  function goHTML5Audio() {
    Q.assets = {};
    Q.audio.enableHTML5Sound();
    loadAssetsAndGo();
  }

  function goWebAudio() {
    Q.assets = [];
    Q.audio.enableWebAudioSound();
    loadAssetsAndGo();
  }

  Q.input.keyboardControls();
  Q.input.touchControls({ 
            controls:  [ ['left','<' ],[],[],[],['right','>' ] ]
  });
  
  Q.enableSound = function() {
    var hasTouch =  !!('ontouchstart' in window);

    if(Q.hasWebAudio) {
      Q.audio.enableWebAudioSound();
    } else {
      Q.audio.enableHTML5Sound();
    }
    return Q;
  };
  
  


  Q.Sprite.extend("Paddle", {     // extend Sprite class to create Q.Paddle subclass
    init: function(p) {
      this._super(p, {
        sheet: 'paddle',
        speed: 200,
        x: 0,
      });
      this.p.x = Q.width/2 - this.p.w/2;
      this.p.y = Q.height - this.p.h;
      if(Q.input.keypad.size) {
        this.p.y -= Q.input.keypad.size + this.p.h;
      }
    },

    step: function(dt) {
      if(Q.inputs['left']) { 
        this.p.x -= dt * this.p.speed;
      } else if(Q.inputs['right']) {
        this.p.x += dt * this.p.speed;
      }
      if(this.p.x < 25) { 
        this.p.x = 25;
      } else if(this.p.x > Q.width - 25) { 
        this.p.x = Q.width - 25;
      }
//      this._super(dt);	      // no need for this call anymore
    }
  });

  Q.Sprite.extend("Ball", {
    init: function(p) {
      this._super(p,{
        sheet: 'ball',
        speed: 200,
        dx: 1,
        dy: -1,
        lives: 3,
        score: 0
      });
      this.p.y = Q.height / 2 - this.p.h;
      this.p.x = Q.width / 2 + this.p.w / 2;
	  
	  this.on('hit', this, 'collision');  // Listen for hit event and call the collision method
	  
	  this.on('step', function(dt) {      // On every step, call this anonymous function
		  var p = this.p;
		  Q.stage().collide(this);   // tell stage to run collisions on this sprite

		  p.x += p.dx * p.speed * dt;
		  p.y += p.dy * p.speed * dt;

		  if(p.x < 0) { 
			p.x = 0;
			p.dx = 1;
                        Q.audio.play("16295__ltibbits__rim4-tom-16.mp3");
		  } else if(p.x > Q.width - p.w) { 
			p.dx = -1;
			p.x = Q.width - p.w;
                        Q.audio.play("16295__ltibbits__rim4-tom-16.mp3");
		  }

		  if(p.y < 0) {
			p.y = 0;
			p.dy = 1;
                        Q.audio.play("16295__ltibbits__rim4-tom-16.mp3");
		  } else if(p.y > Q.height) { 
			this.p.lives -= 1;
                        Q.stageScene('hud', 3, this.p);
                        this.p.y = Q.height / 2 - this.p.h;
                        this.p.x = Q.width / 2 + this.p.w / 2;
                        this.p.dx = 1;
                        this.p.dy = -1;
                        if(p.lives < 1){
                            Q.stageScene('lossMenu');
                            Q.clearStage(3);
                        }
		  }
	  });
    },
	
	collision: function(col) {                // collision method
		if (col.obj.isA("Paddle")) {
//			alert("collision with paddle");
			this.p.dy = -1;
                        Q.audio.play("16287__ltibbits__kick-high-vol.mp3");
		} else if (col.obj.isA("Block")) {
//			alert("collision with block");
			col.obj.destroy();
			this.p.dy *= -1;
                        this.p.score += 100;
                        Q.stageScene('hud', 3, this.p);
		}
	}
  });

  Q.Sprite.extend("Block", {
    init: function(props) {
      this._super(_(props).extend({ sheet: 'block'}));
      this.on('collision',function(ball) { 
        this.destroy();
        ball.p.dy *= -1;
        Q.stage().trigger('removeBlock');
      });
    }
  });

//  Q.load(['blockbreak.png','blockbreak.json'], function() {
  Q.load(['blockbreak.png', "16287__ltibbits__kick-high-vol.mp3", "16292__ltibbits__rim1-snare.mp3", "16295__ltibbits__rim4-tom-16.mp3"], function() {
    // Q.compileSheets('blockbreak.png','blockbreak.json');  
	Q.sheet("ball", "blockbreak.png", { tilew: 20, tileh: 20, sy: 0, sx: 0 });
	Q.sheet("block", "blockbreak.png", { tilew: 40, tileh: 20, sy: 20, sx: 0 });
	Q.sheet("paddle", "blockbreak.png", { tilew: 60, tileh: 20, sy: 40, sx: 0 });
    
    Q.scene('mainMenu',new Q.Scene(function(stage) {
        stage.insert(new Q.UI.Text({ 
        label: "Block Breaker!",
        color: "blue",
        x: Q.width/2, 
        y: Q.height/4
        }));
        stage.insert(new Q.UI.Text({ 
        label: "        Left arrow moves you left.  \n\
        Right arrow moves you right.  \n\
        Press space to begin!",
        color: "yellow",
        size: "12",
        x: Q.width/2, 
        y: Q.height*(3/4)
        }));
        Q.input.on('fire',function() {
           Q.stageScene("game");
        });
    }));
    
    Q.scene('winMenu',new Q.Scene(function(stage) {
        stage.insert(new Q.UI.Text({ 
        label: "YOU WIN!",
        color: "yellow",
        x: Q.width/2, 
        y: Q.height/4
        }));
        stage.insert(new Q.UI.Text({ 
        label: "Press space to play again.",
        color: "green",
        size: "12",
        x: Q.width/2, 
        y: Q.height*(3/4)
        }));
        Q.input.on('fire',function() {
           Q.stageScene("game");
        });
    }));
    
    Q.scene('lossMenu',new Q.Scene(function(stage) {
        stage.insert(new Q.UI.Text({ 
        label: "Sorry, You lost.",
        color: "red",
        x: Q.width/2, 
        y: Q.height/4
        }));
        stage.insert(new Q.UI.Text({ 
        label: "Press space to play again.",
        color: "green",
        size: "12",
        x: Q.width/2, 
        y: Q.height*(3/4)
        }));
        Q.input.on('fire',function() {
           Q.stageScene("game");
        });
    }));
    
    Q.scene('hud',function(stage) {
        var container = stage.insert(new Q.UI.Container({
            x: 50, y: 0
        }));

        var label = container.insert(new Q.UI.Text({x:50, y: 20,
            label: "Score: " + stage.options.score, color: "white" }));

        var lives = container.insert(new Q.UI.Text({x:200, y: 20,
            label: "Lives: " + stage.options.lives, color: "white" }));

        container.fit(20);
    });
 
    Q.scene('game',new Q.Scene(function(stage) {
      stage.insert(new Q.Paddle());
      stage.insert(new Q.Ball());

      var blockCount=0;
      for(var x=0;x<6;x++) {
        for(var y=0;y<5;y++) {
          stage.insert(new Q.Block({ x: x*50+35, y: y*30+50 }));
          blockCount++;
        }
      }
      stage.on('removeBlock',function() {
        blockCount--;
        Q.audio.play("16292__ltibbits__rim1-snare.mp3");
        if(blockCount == 0) {
          Q.stageScene("winMenu");
        }
      });

    }));
    Q.stageScene("mainMenu");
    Q.stageScene('hud', 3, Q('Ball').first().p);
  });  
});