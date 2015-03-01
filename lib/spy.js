function playSFX(track){
	//Don't play if audio is turned off
	
}

//global audio muted check
var audioIsMuted = false;
var CRTMode = true;

/* ---------------------
Gamepad Support

Maybe?
----------------------*/

var GamePadHelperEntity = me.ObjectEntity.extend({
	init: function(x,y,settings){
		this.parent(x,y,settings);
		this.alwaysUpdate = true;
		this.isPersistent = true;

		this.actionPressed = this.cloakPressed = this.rightPressed = this.leftPressed = false;
		
		this.gamepadSupportAvailable = !!navigator.webkitGetGamepads || !!navigator.webkitGamepads;
		
		//
		console.log('GamePad Support Available? ' + this.gamepadSupportAvailable);
		
	},
	update: function(){
		//Chrome
		if(this.gamepadSupportAvailable){			
			var gamepad = navigator.webkitGetGamepads()[0];
			if(gamepad !== undefined) {
				//console.log('GamePad Connected');
				//console.log(gamepad);
				//Button Down
				
				//Button Up 
				
				var buttons = gamepad.buttons;

				//Test
				if(buttons){
					
					if(buttons[0] || buttons[3] || buttons[9]){ //X
						me.input.triggerKeyEvent(me.input.KEY.SPACE, true); //Start/Jump/Action
						this.actionPressed = true; 
					}else if(this.actionPressed){
						this.actionPressed = false; 
						me.input.triggerKeyEvent(me.input.KEY.SPACE, false); //Start/Jump/Action
					}
					
					if(buttons[1] || buttons[2] ){ //O
						this.cloakPressed = true;
						me.input.triggerKeyEvent(me.input.KEY.S, true); //Cloak
					}else if(this.cloakPressed){
						this.cloakPressed = false;
						me.input.triggerKeyEvent(me.input.KEY.S, false); //Cloak
					}
					
					if(buttons[15]){ //right
						this.rightPressed = true;
						me.input.triggerKeyEvent(me.input.KEY.D, true); //Move Right
					}else if(this.rightPressed){
						this.rightPressed = false;
						me.input.triggerKeyEvent(me.input.KEY.D, false); //Move Right
					}
					
					if(buttons[14]){ //left
						this.leftPressed = true;
						me.input.triggerKeyEvent(me.input.KEY.A, true); //Move Left
					}else if(this.leftPressed){
						this.leftPressed = false;
						me.input.triggerKeyEvent(me.input.KEY.A, false); //Move Left
					}
					
				}
			
			}else{
				//console.log('GamePad Not Connected');
			}
		}
		this.parent(this);
		return true;
	}
});

/* ---------------------
a spy entity
----------------------*/

var SpyEntity = me.ObjectEntity.extend({
	init: function(x,y,settings){
		settings.spriteheight = 32;
		this.parent(x,y,settings);
		this.type = me.game.SPY;
		this.alwaysUpdate = true;
		//Let's reduce gravity a bit		
		this.setVelocity(1.5,7.5);
		this.setMaxVelocity(1.5,7.5);
		this.initialGravity = this.gravity = (0.41);
		this.cloakedVelx = (this.maxVel.x * .5);
		this.cloakedVely = (this.maxVel.y * .5);
		this.cloakedAccel = this.cloakedVel;
		this.collidable = true;
		if(me.gamestat.getItemValue('stealthState') === 1){
			this.stealthOn = true;
		}else{
			this.stealthOn = false;
		}
		this.hasKey = false;
		this.wasFalling = false;
		this.alive = true;
		this.isCaught = false;
		this.moving = false;
		this.toggledCloak = false;
		this.onPlatform = false;
		//this.caught = false;
		this.updateColRect(6,12,8,24);
		this.flipX(true);
		this.gotKey = false;
		this.flipJumpCol = false;
		//add animations
		//jump - 5
		//land - 6
		//cloaking - 7 8 9
		//cloak walk 11 12
		//cloak stand 10
		//c jump 13
		//c land 14
		//caught 15
		//c caught 16
		
		//add animations
		//stand 0
		//walk - 1,2,3,4
		//jump - 5,6
		//flip - 7,8,9
		//fall - 10,11
		//land - 12
		//cloaking - 13,14,15
		//cloaking walking - 13,15
		//uncloaking - 15,14,13
		//jump cloak - 16
		//jump uncloak - 16
		//uncloaking walking - 15,13
		//Cloak stand 27,28,29,30,31,32,33,34
		//cloak walk 35,36,37,38
		//c jump 39,40
		//c fall 41,42
		//caught 15
		//c caught 16
		//exit 18,19
		//exit cloaked 20,21
		
		this.renderable.addAnimation('stand', [0]);
		this.renderable.addAnimation('walk', [1,2,3,4]);
		this.renderable.addAnimation('jump', [5,6]);
		this.renderable.addAnimation('fall', [10,11]);
		this.renderable.addAnimation('land', [12],12);
		this.renderable.addAnimation('caught', [22]);
		this.renderable.addAnimation('keyGet', [17],12);
		this.renderable.addAnimation('cloaking', [13,14,15]);
		this.renderable.addAnimation('walkingCloak', [13,15]);
		this.renderable.addAnimation('jumpingCloak', [16]);
		this.renderable.addAnimation('uncloaking', [15,14,13]);
		this.renderable.addAnimation('walkingUncloak', [15,13]);
		this.renderable.addAnimation('cloakWalk', [34,35,36,37]);
		this.renderable.addAnimation('cloakStand', [26,27,28,29,30,31,32,33]);
		this.renderable.addAnimation('cloakJump', [38,39]);
		this.renderable.addAnimation('cloakFall', [40,41]);
		this.renderable.addAnimation('cloakLand', [42],12);
		this.renderable.addAnimation('cloakCaught', [23]);
		this.renderable.addAnimation('cloakKeyGet', [43]);
		
		
		this.renderable.addAnimation('cloakExitDoor', [20,21]);
		this.renderable.addAnimation('exitDoor', [18,19]);
		
		this.renderable.addAnimation('cloakEnterDoor', [21,20]);
		this.renderable.addAnimation('enterDoor', [19,18]);
		
		this.renderable.addAnimation('flip', [7,8,9],3);
		
		this.tranCounter = 0;
		
		//1 = Right, 0 = Left
		this.currentDirection = true;
		//this.renderable.setCurrentAnimation('stand');
		//Enter the level
		this.transitioning = true;
		if(this.stealthOn){
			this.renderable.setCurrentAnimation('cloakExitDoor','cloakStand');
		}else{
			this.renderable.setCurrentAnimation('exitDoor','stand');
		}
		
		
		//bad code here
		
		controlHandler = new ControlHandlerEntity(0,0);
		me.game.add(controlHandler,this.z);
		camera = new CameraEntity(0,0);
		me.game.add(camera,this.z);
		
		spy = this;		
		
		//me.game.viewport.fadeIn('#000000',1,function(){ me.game.viewport.fadeOut('#000000',300); });
		//me.game.viewport.fadeOut('#000000',300);
		//Transition
		leveltransition = new LevelTransitionEntity(this.pos.x - 320, this.pos.y - 240, {image:'spiraltransition3', spritewidth:640, spriteheight: 480, transitionType: 'in' });
		me.game.add(leveltransition,60);
		me.game.sort();	
		
	},
	update: function(){
		if(this.exiting){
			//When Spy hits the door, he should stop momentum and slide in
			//check for: spy below door (coming up through platform)
			//spy above door/spy jumping
			//test with guards and stuff
			
			//position the spy
			if(this.currentDirection && this.pos.x < this.doorX - 4){
				this.pos.x += 1.5;
				console.log(this.pos.x + ' ' + this.doorX);
			
			}else if(!this.currentDirection && this.pos.x > this.doorX - 4){
				this.pos.x -= 1.5;
			
			}else{
				if(this.stealthOn){
					this.renderable.setCurrentAnimation('cloakEnterDoor', function(){ this.renderable.alpha = 0; }.bind(this));
				}else{
					this.renderable.setCurrentAnimation('enterDoor', function(){ this.renderable.alpha = 0; }.bind(this));
				}
			
			}
			this.parent(this);
			return true;
		}
		
		//If caught, we want to finish any previous movements  from jumping/falling
		if(!this.alive){			
			//Update Movement
			if(this.falling || this.jumping){
				this.updateMovement();
			}
			if(this.dJumping){
				this.updateColRect(6,12,8,24);
				this.dJumping = false;
			}
			//Don't update Animation
			return false;			
		}
		
		//When Entering Level, let's take away control briefly to play entrance animation
		if(this.transitioning){
			this.tranCounter += me.timer.tick;
			if(this.tranCounter < 30){	//Half Second Pause
				this.parent(this);
				return true;
				console.log(this.tranCounter);
			}else{
				this.tranCounter = 0;				
				this.transitioning = false;
			}
		}
		
			
		//Player Controls
				
		//Flash
		if(me.input.isKeyPressed('flash')){
			this.renderable.setCurrentAnimation('cloaking');
			this.moving = true;
		}
		
		//Toggle Invisibility
		if(me.input.isKeyPressed('stealth')) this.toggleCloak();
		
		//Movement
		if(me.input.isKeyPressed('left')){
			me.gamestat.updateValue("stepCountTemp", me.timer.tick);
			this.moving = true;
			this.currentDirection = false;
			//Will have to check for jumping later on
			if(this.stealthOn){
				if(!this.jumping){					
					if(this.toggledCloak){
						this.renderable.setCurrentAnimation('walkingCloak','cloakWalk');
					}else if(!this.renderable.isCurrentAnimation('cloakWalk') && !this.renderable.isCurrentAnimation('walkingCloak')){
						this.renderable.setCurrentAnimation('cloakWalk');
					}
				}
			
				this.vel.x = -this.cloakedVelx * me.timer.tick;
			}else{
				if(!this.jumping){
					if(this.maxVel.x != 1.5){
						this.setMaxVelocity(1.5,7.5);
					}
					
					if(this.toggledCloak){
						this.renderable.setCurrentAnimation('walkingUncloak','walk');
					}else if(!this.renderable.isCurrentAnimation('walk') && !this.renderable.isCurrentAnimation('walkingUncloak')){
						this.renderable.setCurrentAnimation('walk');
					}
					
					this.vel.x -= this.accel.x * me.timer.tick;
				}else{
					if(this.maxVel.x != 2.25){
						this.setMaxVelocity(2.25,7.5);
					}
					this.vel.x -= this.accel.x * me.timer.tick;
					
					if(this.dJumping){
						this.vel.y = this.gravity * -1;
					}
				}		
			}	
		}else if(me.input.isKeyPressed('right')){
			me.gamestat.updateValue("stepCountTemp", me.timer.tick);
			this.moving = true;
			this.currentDirection = true;
			if(this.stealthOn){
				if(this.toggledCloak){
					this.renderable.setCurrentAnimation('walkingCloak','cloakWalk');
				}else if(!this.renderable.isCurrentAnimation('cloakWalk') && !this.renderable.isCurrentAnimation('walkingCloak')){
					this.renderable.setCurrentAnimation('cloakWalk');
				}
			
				if(this.jumping){
					this.vel.x = this.cloakedVelx * me.timer.tick;
				}else{
					this.vel.x = this.cloakedVelx * me.timer.tick;
				}
			}else{
				if(!this.jumping){
					if(this.maxVel.x != 1.5){
						this.setMaxVelocity(1.5,7.5);
					}
					
					if(this.toggledCloak){
						this.renderable.setCurrentAnimation('walkingUncloak','walk');
					}else if(!this.renderable.isCurrentAnimation('walk') && !this.renderable.isCurrentAnimation('walkingUncloak')){
						this.renderable.setCurrentAnimation('walk');
					}
					this.vel.x += this.accel.x * me.timer.tick;	
				}else{
					if(this.maxVel.x != 2.25){
						this.setMaxVelocity(2.25,7.5);
					}
					this.vel.x += this.accel.x * me.timer.tick;	
					
					if(this.dJumping){
						this.vel.y = this.gravity * -1;
					}
				}					
			}			
		}else{			
			this.moving = false;
			this.vel.x = 0;			
			if(!this.renderable.isCurrentAnimation('cloaking') && !this.renderable.isCurrentAnimation('uncloaking') && !this.renderable.isCurrentAnimation('cloakLand') && !this.renderable.isCurrentAnimation('land') && !this.renderable.isCurrentAnimation('walkingUncloak') && !this.renderable.isCurrentAnimation('walkingCloak')  && !this.renderable.isCurrentAnimation('jump')  && !this.renderable.isCurrentAnimation('cloakJump') && !this.renderable.isCurrentAnimation('cloakFall') && !this.renderable.isCurrentAnimation('fall') && !this.renderable.isCurrentAnimation('flip')){
				if(this.stealthOn){
					this.renderable.setCurrentAnimation('cloakStand');
				}else{
					this.renderable.setCurrentAnimation('stand');
				}
			}			
		}
		
		//jump
		if(me.input.isKeyPressed('jump')){
			if(!this.jumping && !this.falling){
				me.gamestat.updateValue("jumpCountTemp", 1);
				//set current vel to the maximum defined value
				//gravity will then do all the rest
				this.vel.y = -this.maxVel.y * me.timer.tick;
				//set the jumping flag
				this.jumping = true;
				this.wasJumping = true;
				this.moving = true;
				//adudio
				me.audio.play("jump");
				this.jumpDust();
			
				if(this.stealthOn){				
					this.renderable.setCurrentAnimation('cloakJump');
				}else{
					this.renderable.setCurrentAnimation('jump');
				}
			}else if(this.wasJumping && !this.dJumping && !this.stealthOn){ //Subtle Jump Stop
				this.vel.y = this.gravity * -1;
				this.dJumping = true;
				this.updateColRect(6,12,8,16);
				this.renderable.setCurrentAnimation('flip','fall');
				me.audio.play("jump");
			}
		}
		
		if(this.jumping && this.toggledCloak){
			if(this.stealthOn){
				this.renderable.setCurrentAnimation('jumpingCloak','cloakJump');	
			}else{	
				this.renderable.setCurrentAnimation('jumpingCloak','jump');	
			}
		}
		
		if(this.falling && this.toggledCloak){
			if(this.stealthOn){
				this.renderable.setCurrentAnimation('jumpingCloak','cloakFall');	
			}else{	
				this.renderable.setCurrentAnimation('jumpingCloak','fall');	
			}
		}
		
		
		if(this.renderable.isCurrentAnimation('flip')){
			this.dJumping = true;
		}else{
			if(this.dJumping){
				this.updateColRect(6,12,8,24);
				console.log('test');
			}
			this.dJumping = false;			
		}		
		//*
		//Set an animation if landing or falling
		if(this.wasFalling && !this.falling && !this.dJumping && !this.wasJumping){
			this.wasFalling = false;
			this.wasJumping = false;
			//this.animationspeed = 100;
			this.jumpDust();
			me.audio.play("land");
			if(this.stealthOn){
				this.renderable.setCurrentAnimation('cloakLand','cloakStand');
			}else{
				this.renderable.setCurrentAnimation('land','stand');
			}
		} else if(this.falling){
			this.wasJumping = false;
			this.moving = true;
			//this.dJumping = false;
			this.wasFalling = true;
			if(this.stealthOn){				
				this.renderable.setCurrentAnimation('cloakFall');
			}else{
				if(!this.renderable.isCurrentAnimation('flip')){
					this.renderable.setCurrentAnimation('fall');
				}
			}
		}
		
		//*/
		if(this.gotKey == true){
			if(this.stealthOn){
				this.renderable.setCurrentAnimation('cloakKeyGet', function(){ this.gotKey = false; }.bind(this));
			}else{
				this.renderable.setCurrentAnimation('keyGet', function(){ this.gotKey = false; }.bind(this));
			}
		}
		
		this.flipX(this.currentDirection);
		
		if(this.stopX){
			this.vel.x = 0;
		}
		
		//Special Collision Cases
		
		// check for collision
		//var res = me.game.collide(this);
		
		//test to see if this is a performance hog
		/*
		
		var colres = this.collide(true)
		if(this.jumping || colres.length == 0){ 
			this.onPlatform = false; 
		}else{			
			for (i = 0; i < colres.length; ++i) {
				res = colres[i];
				//Trap Door
				if (res && res.obj.type == 'TRAPDOOR' && !res.obj.isOpened && (res.y>0)){
					this.falling = false;
					this.vel.y = 0;
					this.pos.y = ~~(res.obj.pos.y - this.height);	
					this.onPlatform = true;
					
				} else{
					this.onPlatform = false;
				}
			
			}
		}
		
		*/
		//Update Movement
		this.updateMovement();
		
		//console.log(this.pos.y);
		/*
		//Colliding with trap door
		res = this.collide();

		// check if we collide with an enemy :
		if (!this.jumping && res && (res.obj.type == 'TRAPDOOR'))
		{
			if(this.wasFalling && this.falling){
				//console.log('both falling');
				//this.vel.y =  30;	
			}else if(this.wasFalling){
				console.log('was falling');
			}else if (this.falling){
					console.log('falling');
			}
			//this.pos.y = ~~this.pos.y;
			this.pos.y = res.obj.pos.y - this.height; 
			//this.vel.y = (this.falling) ? res.obj.pos.y - this.collisionBox.bottom: 0 ;			
			this.vel.y = 0;
			//console.log(this.vel.y);
			//this.falling = false;			
			//this.onPlatform = true;
			//this.gravity = 0;
			console.log('yes');
		}else{
			console.log('no');
			this.gravity = this.initialGravity;
				this.onPlatform = false;
		}
		
		if(this.onPlatform){
			this.falling = false;
		}
		
		*/
		
		/*
		if (res && (res.obj.type == 'TRAPDOOR') && res.y > 0 && (this.collisionBox.bottom - 1 <= res.obj.pos.y))
		{
			console.log('trap door');
			//this.pos.y = ~~this.pos.y;
			this.pos.y = res.obj.pos.y - this.height; 
			this.vel.y = (this.falling) ? res.obj.pos.y - this.collisionBox.bottom: 0 ;
			
			this.falling = false;
		}
		*/
		
		
		
		//Set some stuff
		this.toggledCloak = false;
		
		//Update Animation
		this.parent(this);
		return true;
		
	},
	toggleCloak: function(){
		this.toggledCloak = true;
		me.gamestat.updateValue("steathCountTemp", 1);
		if(this.stealthOn){ //Turn Stealth Off
			//Will have to check for jumping & moving later on
			this.renderable.setCurrentAnimation('uncloaking','stand');
			this.stealthOn = false;
			me.audio.play('uncloak');
		}else{ //Turn it on
			//this.renderable.setCurrentAnimation('cloaking');
			this.renderable.setCurrentAnimation('cloaking','cloakStand');
			this.stealthOn = true;				
			me.audio.play('cloak');			
		}	
	},
	caught: function(){
		if(this.djump){
			this.updateColRect(6,12,8,24);
		}
		//Reset the current level
		if(this.stealthOn){
			this.renderable.setCurrentAnimation('cloakCaught');
		}else{
			this.renderable.setCurrentAnimation('caught');
		}
		this.alive = false;
		this.isCaught = true;
		me.audio.play('caught');

		me.gamestat.updateValue("timesCaught", 1);
		me.gamestat.setValue("stealthState", 0);
		
		//pause, give option "PRESS R TO RESTART"	
		me.game.add(new YouLostMSGEntity(me.game.viewport.pos.x,me.game.viewport.pos.y),this.z);
		me.game.sort();
		//me.levelDirector.reloadLevel();
        
	},
	caughtKnockedDown: function(direction){
		//Reset the current level
		if(this.stealthOn){
			var cloaked = 'Cloaked';
		}else{
			var cloaked = '';
		}
		
		if(direction == 'left'){
			var flipX = true;
		}else{
			var flipX = false;
		}
		
		
		me.game.viewport.shake(10,100, me.game.viewport.AXIS.BOTH);
				
				
		spycaught = new SpyCaughtEntity(this.pos.x, this.pos.y, {image:'spycaught', spritewidth:32, spriteheight: 32, cloaked: cloaked, flipX: flipX});
			me.game.add(spycaught,this.z);
			me.game.sort();
		
		this.renderable.setOpacity(0);
			
		this.alive = false;
		this.isCaught = true;
		me.audio.play('caught');

		me.gamestat.updateValue("timesCaught", 1);
		me.gamestat.setValue("stealthState", 0);
		
		//pause, give option "PRESS R TO RESTART"	
		me.game.add(new YouLostMSGEntity(me.game.viewport.pos.x,me.game.viewport.pos.y),this.z);
		me.game.sort();
		//me.levelDirector.reloadLevel();
        
	},
	caughtBeam: function(direction){
		//Reset the current level
		if(this.stealthOn){
			var cloaked = 'Cloaked';
		}else{
			var cloaked = '';
		}
		
		if(direction == 'left'){
			var flipX = true;
		}else{
			var flipX = false;
		}
		
		
		me.game.viewport.shake(10,100, me.game.viewport.AXIS.BOTH);
				
				
		spycaught = new SpyBeamedEntity(this.pos.x, this.pos.y, {image:'spybeamed', spritewidth:24, spriteheight: 32, cloaked: cloaked, flipX: flipX});
			me.game.add(spycaught,this.z);
			me.game.sort();
		
		this.renderable.setOpacity(0);
			
		this.alive = false;
		this.isCaught = true;
		me.audio.play('caught');

		me.gamestat.updateValue("timesCaught", 1);
		me.gamestat.setValue("stealthState", 0);
		
		//pause, give option "PRESS R TO RESTART"	
		me.game.add(new YouLostMSGEntity(me.game.viewport.pos.x,me.game.viewport.pos.y),this.z);
		me.game.sort();
		//me.levelDirector.reloadLevel();
	},
	jumpDust: function(){
		jumpdust = new JumpDustEntity(this.pos.x + 4, this.pos.y + 24, {image:'jumpdust', spritewidth:16, spriteheight: 8 });
			me.game.add(jumpdust,this.z + 1);
			//me.game.sort();
	},
	exitLevel: function(doorX){
		//make the spy
		this.doorX = doorX;
		this.exiting = true;
		this.alive = false;
	},
	getKey: function(){
		this.gotKey = true;
	}
});


/* ---------------------
a spy caught entity
----------------------*/

var SpyCaughtEntity = me.ObjectEntity.extend({
	init: function(x,y,settings){
		this.parent(x,y,settings);	
		this.collidable = true;
		this.gravity = (0.41);
		this.setVelocity(2,2);

		if(settings.image == 'spycaughtbeamed'){
			this.beamed = true;
			this.renderable.addAnimation('knockedDown', [0]);
			this.renderable.addAnimation('knockedDownFall', [1,2]);
			this.renderable.addAnimation('knockedDown2', [3]);			

		}else{
			this.beamed = false;
			this.renderable.addAnimation('knockedDown', [0]);
			this.renderable.addAnimation('knockedDownFall', [1]);
			this.renderable.addAnimation('knockedDownFallCloaked', [3]);
			this.renderable.addAnimation('knockedDownCloaked', [2]);
		}
		
		this.flippedX = settings.flipX
		this.flipX(this.flippedX);
		this.cloaked = settings.cloaked;
		//Will check for more conditions probably
		this.renderable.setCurrentAnimation("knockedDown"+this.cloaked);
		
		//TODO: make spy bounce off the ground a little
		this.startPosX = x;
		this.bouncePosX = x + 16;
		this.bounce1 = true;
		this.bounce2 = true;
	},
	update: function(){
		
		if(this.falling){
			this.bouncing = false;
			//TODO: falling animation
			this.renderable.setCurrentAnimation("knockedDownFall"+this.cloaked);
		}
		
		if(this.bouncing){
			//TODO: falling animation
			this.renderable.setCurrentAnimation("knockedDownFall"+this.cloaked);
		}
		
		//make spy bounce off the ground a little
		if(!this.bounce1 && !this.bounce2 && !this.falling  && !this.bouncing ){
			this.renderable.setCurrentAnimation("knockedDown"+this.cloaked);
			this.vel.x = 0;
		}
		
		if(!this.bounce1 && !this.falling && this.bounce2 && !this.bouncing){
			console.log('bounce2');
			this.vel.x = (this.flippedX) ? + 2 * me.timer.tick : - 2 * me.timer.tick;
			
			this.vel.y -= 3 * me.timer.tick;
			this.bounce2 = false;
			this.bouncing = true;
			
			this.renderable.setCurrentAnimation("knockedDown"+this.cloaked);
			
			this.jumpDust();
		}
		
		if(this.bounce1){
			console.log('bounce1');
			this.vel.x = (this.flippedX) ? + 4 * me.timer.tick : - 4 * me.timer.tick;
			
			this.vel.y -= 6 * me.timer.tick;
			this.bounce1 = false;
			this.bouncing = true;
			
			this.jumpDust();
		}
			
		
		
		
		this.updateMovement();
		
		this.parent(this);
		return true;
	},
	jumpDust: function(){
		jumpdust = new JumpDustEntity(this.pos.x + 4, this.pos.y + 24, {image:'jumpdust', spritewidth:16, spriteheight: 8 });
			me.game.add(jumpdust,this.z + 1);
			//me.game.sort();
	},
});


/* ---------------------
a spy caught by beam (fried) entity
----------------------*/

var SpyBeamedEntity = me.ObjectEntity.extend({
	init: function(x,y,settings){
		this.parent(x,y,settings);	
		this.collidable = true;
		this.gravity = (0.41);
		this.setVelocity(2,2);		
		this.renderable.addAnimation('fried', [0,1,2,3],3);
		
		this.flippedX = settings.flipX
		this.flipX(this.flippedX);
		//Will check for more conditions probably
		this.renderable.setCurrentAnimation("fried", function(){ this.knockeddown() }.bind(this));
		
	},
	update: function(){
		
		this.parent(this);
		return true;
	},
	knockeddown: function(){
		spycaught = new SpyCaughtEntity(this.pos.x, this.pos.y, {image:'spycaughtbeamed', spritewidth:32, spriteheight: 32, cloaked: '', flipX: this.flippedX});
			me.game.add(spycaught,this.z);
			me.game.sort();
		
		this.renderable.setOpacity(0);
		me.game.remove(this);
	}
});


/* ---------------------
a jumpdust entity
----------------------*/

var JumpDustEntity = me.ObjectEntity.extend({
	init: function(x,y,settings){
		settings.spritewidth = 16;
		this.type = 'JUMPDUST';
		this.collidable = false; 
		this.gravity= (0);
		this.parent(x,y,settings);
		this.renderable.addAnimation('dust', [0,2]);
		
		this.renderable.setCurrentAnimation("dust", (function () {
			this.remove();
			 return false; // do not reset to first frame
		}).bind(this));
	},
	update: function(){
		this.parent(this);
		return true;
	},
	remove: function(){
		this.renderable.alpha = 0;
		me.game.remove(this);
	}
});


/* ---------------------
a hitspy entity
----------------------*/

var HitSpyEntity = me.ObjectEntity.extend({
	init: function(x,y,settings){
		settings.spritewidth = 16;
		this.type = 'HITSPY';
		this.collidable = false; 
		this.gravity= (0);
		this.parent(x,y,settings);
		this.renderable.addAnimation('dust', [0,1,2,3],4);
		
		this.renderable.setCurrentAnimation("dust", (function () {
			this.remove();
			 return false; // do not reset to first frame
		}).bind(this));
	},
	update: function(){
		this.parent(this);
		return true;
	},
	remove: function(){
		this.renderable.alpha = 0;
		me.game.remove(this);
	}
});


/* ---------------------
a keycard entity
----------------------*/
var KeyCardEntity = me.ObjectEntity.extend({
	init:function(x,y,settings){
		this.parent(x,y,settings);
		this.collidable = false; //TODO: Set to false, do own collision checking
		this.renderable.addAnimation('keycard',[0,0,0,0,0,0,0,0,1,2,3]);
		this.renderable.setCurrentAnimation('keycard');
	},
	//check for collision with player, unlock the door
	update: function(){
		//Don't update if not on screen
		if(!this.visible){
			return false;
		}
		
		//TODO: custom collision detection here for multiple collisions
		//var res = me.game.collide(this);
		//if(res && (res.obj.type == me.game.SPY)){
		if(this.overlaps(spy.collisionBox)){
			//audio
		
			//Update the hud

			//make sure it cannot be collected "again" (only allow once collision)
			this.collidable = false;
			spy.getKey();
			//remove it
			me.game.remove(this);
			me.audio.play('keycard');
			//Unlock the door
			//TODO: Move this into ExitEntity
			
			me.game.getEntityByName("exitdoor")[0].keys++;
			if(me.game.getEntityByName("exitdoor")[0].keys == 1){
				me.game.getEntityByName("exitdoor")[0].renderable.setCurrentAnimation('unlocked');
			}else{
				me.game.getEntityByName("exitdoor")[0].renderable.setCurrentAnimation('unlocked2');
			}
		}			
		this.parent(this);
		return true;		
	}
});

/* ---------------------
an exit door entity
----------------------*/
var ExitEntity = me.ObjectEntity.extend({
	init:function(x,y,settings){
		this.parent(x,y,settings);
		(settings.nextLevel) ? this.nextLevel = settings.nextLevel : this.nextLevel = false;
		this.locked = true;
		this.collidable = true;
		this.alwaysUpdate = true;
		this.keys = 0;
		this.opened = false;
		this.timer = 0;
		
		
		(settings.keyReq || settings.keyReq === 0) ? this.keyReq = settings.keyReq : this.keyReq = 1;
		
		(settings.toCutscene) ? this.toCutscene = settings.toCutscene : this.toCutscene = false;
		
		
		
		
		//TODO: different animation if keyReq is > 1		
		if( this.keyReq  == 2 ){
			this.renderable.addAnimation('locked',[1]);
			this.renderable.addAnimation('unlocked2',[0]);
			this.renderable.addAnimation('unlocked',[2]);
			this.renderable.addAnimation('open',[3,4]);
			this.renderable.addAnimation('opened',[4]);
			this.renderable.setCurrentAnimation('locked');
		}else{
			this.renderable.addAnimation('locked',[1]);
			this.renderable.addAnimation('unlocked',[0]);
			this.renderable.addAnimation('open',[3,4,2]);
			this.renderable.addAnimation('opened',[2]);
			this.renderable.setCurrentAnimation('locked');
		}

		
		//this.animationspeed = me.sys.fps / 20;
		
		/*
		if(this.toCutscene){
			//Hide the door
			this.renderable.setOpacity(0);
			console.log('Going to Cutscene');
		}
		*/
		//console.log('Alpha: ' + this.renderable.getOpacity() + ' ' + this.renderable.alpha);
		
		if(this.toCutscene){
			//Expand the door collision area to make bounding box
			this.updateColRect(0,settings.width,0,settings.height);
			this.renderable.setOpacity(0);
			this.renderable.alpha = 0;
		}
	},
	update:function(){
		if(this.toCutscene){
			//Hide the door
			//this.renderable.setOpacity(0);			
		}
		if(this.alive){
			var res = me.game.collide(this);
			if(res && (res.obj.type == me.game.SPY) && this.keys >= this.keyReq  && !this.opened && spy.alive && !spy.falling && !spy.jumping){
				//Don't activate the door if the spy is falling or jumping
				//only work if spy is actually in the door frame
				//if spy.pos.x
				//this.pos.x
				//
				//console.log("Spy: " + spy.pos.x + " Door: " + this.pos.x);
				//Right
				/*
				if((!spy.currentDirection && spy.pos.x > this.pos.x + 8 && spy.pos.x < this.pos.x + 16) || (spy.currentDirection && spy.pos.x > this.pos.x && spy.pos.x < this.pos.x + 8)){
				*/
								
				if(spy.pos.x > this.pos.x - 12 && spy.pos.x < this.pos.x + 8 && !this.toCutscene){
				
					spy.pos.y = this.pos.y;
					
					//audio		
					me.audio.play('levelclear');
					
					//Spy
					spy.exitLevel(this.pos.x);
					
					//Transition
					//*
					this.startTransition();
					//spy.renderable.setCurrentAnimation('cloakExit');
					//this.toNextLevel()
				}else if(this.toCutscene){
					this.startTransition();
				}
			}
			
			if(this.opened){
				this.timer += me.timer.tick;
				if(this.timer >= 9){
					
					
					//console.log('tst');
					
				}
			}
		}
		
		this.parent(this);
		return true;		
	},
	startTransition: function(){
		leveltransition = new LevelTransitionEntity(this.pos.x - 320, this.pos.y - 240, {image:'spiraltransition3', spritewidth:640, spriteheight: 480, transitionType: 'out' });
		me.game.add(leveltransition,60);
		me.game.sort();
		//*/
		//take me to the next level
		this.renderable.setCurrentAnimation('open', function(){ this.fadeToNextLevel(); }.bind(this));
		console.log('opening...');
		
		this.opened = true;
	},
	fadeToNextLevel: function(){
		console.log('opened');
		this.renderable.setCurrentAnimation('opened');
		me.game.viewport.fadeIn('#000000',300, function(){ this.toNextLevel() }.bind(this));
		//spy.alive = false;
		
	},
	toNextLevel:function(){
		
		//Copy temp Stats over
		me.gamestat.updateValue("stealthCount", me.gamestat.getItemValue('stealthCountTemp'));
		me.gamestat.updateValue("stepCoun", me.gamestat.getItemValue('stepCountTemp'));
		me.gamestat.updateValue("jumpCount", me.gamestat.getItemValue('jumpCountTemp'));
		me.gamestat.updateValue("dangerCount", me.gamestat.getItemValue('dangerCountTemp'));
		
		me.gamestat.setValue("stealthCountTemp", 0);
		me.gamestat.setValue("stepCountTemp", 0);
		me.gamestat.setValue("jumpCountTemp", 0);
		me.gamestat.setValue("dangerCountTemp", 0);

		if(this.nextLevel){
			if(this.nextLevel == 'GAME_END'){
				//Check For Game End
				//Level 10 for prototype
				me.state.change(me.state.GAME_END);
			}else{
				this.alive = false;
				//me.state.change(me.state.READY, this.nextlevel);
				if(spy.stealthOn){
					me.gamestat.setValue('stealthState', 1);
				}else{
					me.gamestat.setValue('stealthState',0);
				}
				//me.game.HUD.setItemValue('LevelName',this.nextLevel);
				me.levelDirector.loadLevel(this.nextLevel);
			}
		}		
	}
	
});

var LevelTransitionEntity = me.ObjectEntity.extend({
	init: function(x,y,settings){
		settings.spriteWidth = 640;
		this.parent(x,y,settings);
		this.alwaysUpdate = true;
		
		this.renderable.addAnimation('trans', [11,10,9,8,7,6,5,4,3,2,1,0], 1);
		this.renderable.addAnimation('end', [0], 1);
		this.renderable.addAnimation('transR', [0,1,2,3,4,5,6,7,8,9,10,11], 1);
		//this.renderable.isPersistent = true;
		
		this.transitionType = settings.transitionType;
		
		(settings.volumeStep) ? this.volumeStep = settings.volumeStep : this.volumeStep = .0025;
		(settings.playSound) ? this.playSound = settings.playSound : this.playSound = false;
		
		this.currentVol = .5;
		this.startVol = .5;
		
		if(this.playSound){
			me.audio.play(this.playSound);
		}
		
		if(settings.transitionType == 'out'){
			this.renderable.setCurrentAnimation('trans', 'end');
			
			//console.log('vol: ' + me.audio.getVolume());
			//me.audio.setVolume(.05);
		}else{
			me.game.viewport.fadeOut('#000000',300);
			this.renderable.setCurrentAnimation('transR', function() {this.remove()}.bind(this));
			//me.audio.setVolume(1);
		}
	},
	update: function(){
		if(me.audio.getCurrentTrack()){
			this.currentVol = me.audio.getTrackVolume(me.audio.getCurrentTrack());
		}
		
		if(this.transitionType == 'out'){		
			
			if(me.audio.getCurrentTrack()){
				
				this.currentVol -= this.volumeStep * me.timer.tick;
				//console.log('vol: ' + me.audio.getVolume());
				me.audio.setTrackVolume(me.audio.getCurrentTrack(), this.currentVol);
			}
		}else{
			if(me.audio.getCurrentTrack() && this.currentVol <= this.startVol){
				this.currentVol += this.volumeStep * me.timer.tick;
				me.audio.setTrackVolume(me.audio.getCurrentTrack(), this.currentVol);
			}
		}
		
		this.parent(this);
		return true;
	},
	toNextLevel: function(){
		this.renderable.setCurrentAnimation('transR', function() {this.remove()}.bind(this));		
	},
	remove: function(){
		this.renderable.alpha = 0;
		//me.audio.setTrackVolume(me.audio.getCurrentTrack(), 1);
		me.game.remove(this)
	}
});


/* ---------------------
Audio Toggle 

Plays or Fades In/Out a tracks when initiated
----------------------*/

var AudioToggleEntity = me.ObjectEntity.extend({
	init: function(x,y,settings){
		this.parent(x,y,settings);
		this.alwaysUpdate = true;
		this.isper
		
	},
	update: function(){
		if(me.input.isKeyPressed('audio')){ 
		console.log('test mute');
			if(audioIsMuted == true){
				me.audio.unmuteAll();
				audioIsMuted = false;
			}else{
				me.audio.muteAll();
				audioIsMuted = true;
			}
		}
		
		this.parent(this);
		return true;
	}
});

/* ---------------------
Audio Controller

Plays or Fades In/Out a tracks when initiated
----------------------*/

var AudioControllerEntity = me.ObjectEntity.extend({
	init: function(x,y,settings){
		this.parent(x,y,settings);
		this.alwaysUpdate = true;
		
		//(settings.fade) ? this.fade = settings.fade : this.fade = 'out';
		(settings.fade) ? this.fade = settings.fade : this.fade = 'in';
		(settings.newTrack) ? this.newTrack = settings.newTrack : this.newTrack =  false;
		//Play Track if specified
		
		//Fade Track?
		
		this.startFadeIn = false;
		this.trackStarted = false;
		
		this.fadeTo = settings.fadeTo;
		(settings.fadeStep) ? this.fadeStep = settings.fadeStep : this.fadeStep = .01;

		this.currentVol = .5;
		
	},
	update: function(){
		
		//play track
		//TODO: check for track playing, fade out
		//start new track, fade in
		if(!this.trackStarted && this.fade == 'in'){
			console.log('track started');
			me.audio.playTrack(this.newTrack,0);
			me.audio.unmute(me.audio.getCurrentTrack());
			this.trackStarted = true;
			this.currentVol = 0;
			this.startFadeIn = true;
			
			console.log(this.currentVol +  ' : ' + this.fadeTo);
		}
		
		
		if(this.startFadeIn){
			
			if(this.currentVol <= this.fadeTo){
				
				this.currentVol += this.fadeStep * me.timer.tick;
				me.audio.setTrackVolume(me.audio.getCurrentTrack(), this.currentVol);
			}
		}
		
		this.parent(this);
		return true;
	}
});

/* ---------------------
Audio Controller

Plays or Fades In/Out a tracks when colldided with
----------------------*/

var AudioFaderEntity = me.ObjectEntity.extend({
	init: function(x,y,settings){
		this.parent(x,y,settings);
		this.alwaysUpdate = true;
		this.isPersistent = true;
		(settings.fade) ? this.fade = settings.fade : this.fade = 'out';
		//Play Track if specified
		
		//Fade Track?
		
		this.startFade = false;
		
		this.fadeTo = settings.fadeTo;
		this.fadeStep = settings.fadeStep;
		if(this.fade == 'in'){
			this.currentVol = 0;
		}else{
			this.currentVol = .5;
		}
		
		(me.audio.getCurrentTrack()) ? this.currentTrack = me.audio.getCurrentTrack() : this.currentTrack = false;
				
		//console.log('fade: ' + this.fadeTo);
		
	},
	update: function(){
		
		//check for collision with spy
		var res = me.game.collide(this);
		if(res && (res.obj.type == me.game.SPY)){
			this.startFade = true;		
		}
		
		if(this.startFade){
			if(me.audio.getCurrentTrack() && this.currentTrack == me.audio.getCurrentTrack()){
				if(this.fade == 'out'){
					if(this.currentVol >= this.fadeTo){
						this.currentVol -= this.fadeStep * me.timer.tick;
						me.audio.setTrackVolume(me.audio.getCurrentTrack(), this.currentVol);
					}else{
						me.audio.stop(me.audio.getCurrentTrack());
						me.audio.mute(me.audio.getCurrentTrack());
						me.game.remove(this);
					}
				
				}else if(this.fade == 'in'){
					if(this.currentVol <= this.fadeTo){
						this.currentVol += this.fadeStep * me.timer.tick;
						me.audio.setTrackVolume(me.audio.getCurrentTrack(), this.currentVol);
					}
				}
			}
		}
		
		this.parent(this);
		return true;
	}
});

/* ---------------------
CRT Toggle 

Turns on/off CRT Scanline effect. Just cause.
----------------------*/

var CRTToggleEntity = me.ObjectEntity.extend({
	init: function(x,y,settings){
		settings.spritewidth = 320;
		settings.image = 'crtoverlay';
		this.parent(0,0,settings);
		this.anchorPoint.set(0,0);
		this.floating = true;
		this.isPersistent = true;
		this.alwaysUpdate = true;
		this.alphaFix = true;
		//set up animations
		this.renderable.addAnimation('static',[0,1,2,3],1);
		this.renderable.addAnimation('scanlines',[4,5,6,7],1);
		this.renderable.setCurrentAnimation('scanlines');
		this.transitioning = false;
		
		this.CRTMode = true;
	},
	update: function(){
		if(this.alphaFix){
			//this.renderable.setOpacity(0);
			this.alphaFix = false;
		}
		
		if(me.input.isKeyPressed('crt') && !this.transitioning) { 		
			this.transitioning = true;
			me.audio.play('whitenoise');
			if(this.CRTMode == true){ //Turn Off				
				this.CRTMode = false;
				//play sfx
				this.renderable.setCurrentAnimation('static', function(){this.toggleCRTOff()}.bind(this));
								
			}else{ //Turn On
				this.CRTMode = true;
				//play sfx
				this.renderable.setOpacity(1);
				this.renderable.setCurrentAnimation('static',function(){ this.toggleCRTOn() }.bind(this));				
			}
		}
		
		this.parent(this);
		return true;
	},
	toggleCRTOff: function(){
		this.renderable.setOpacity(0);
		this.renderable.setCurrentAnimation('scanlines');
		this.transitioning = false;
	},
	toggleCRTOn: function(){
		this.renderable.setCurrentAnimation('scanlines');
		this.transitioning = false;
	}
});


/* ---------------------
a enemy entity

parent entity that controls position reset
----------------------*/
var enemyEntity = me.ObjectEntity.extend({
	init: function(x,y,settings){
		this.parent(x,y,settings);
		//need a flag for reset
		this.reset = false;
		this.alwaysUpdate = true;
	},
	update: function(){
		//if(this.resetCheck(this.startPosX,this.startPosY)) return false;
		this.parent(this);
		return true;
	},
	resetCheck: function(x,y){
		if(!this.inViewport){
			if(!this.reset){
				this.reset = true;
				this.resetPos(x,y);
				this.alwaysUpdate = false;
				return false;
			}else{
				return true;
			}
		}else{
			if(this.reset !== false){
			this.reset = false;
			this.alwaysUpdate = true;
			}
			return false;
		}
	},
	resetPos: function(x,y){
		this.pos.x = x;
		if(y) this.pos.y = y;
	}
});


/* ---------------------
a lazy security guard entity
----------------------*/

var LazyGuardEntity = me.ObjectEntity.extend({
	init:function(x,y,settings){
		this.parent(x,y,settings);
		this.type = me.game.ENEMY_OBJECT;
		
		//set up bounding box for seeing the spy
		this.dangerZoneTop = y;
		this.dangerZoneBottom = y + settings.height;
		this.dangerZoneLeft = x;
		this.dangerZoneRight = x + settings.width;
		
		//set up animations
		this.renderable.addAnimation('stand',[0]);
		
		this.image = settings.image;
		
		if(this.image == 'lazyguard3'){
			this.renderable.addAnimation('yawn',[1,2,2,2,3,3],12);
			this.renderable.addAnimation('catch',[4]);
			this.renderable.addAnimation('alarmed',[5,6],60);
			this.animationArray = ['yawn'];
			//set up animation timer
			this.animationCount = 180;
			
		}else{
			this.renderable.addAnimation('scratch',[1,2,1,2],12);
			this.renderable.addAnimation('yawn',[3],40);
			this.renderable.addAnimation('catch',[4]);
			this.renderable.addAnimation('alarmed',[5,6],60);
			this.animationArray = ['scratch','yawn'];
			//set up animation timer
			this.animationCount = 180;
		}
		this.renderable.setCurrentAnimation('stand');
		
		
		this.animationC = 0;
		
		//Position guard
		if(settings.startSide == 'left'){
			this.pos.x = x;
			this.flipX(true);
			this.dangerZoneLeft = this.dangerZoneLeft + 8;
		}else{
			this.pos.x = x + settings.width - settings.spritewidth;
			this.dangerZoneRight = this.dangerZoneRight - 8;
		}
	},
	update: function(){
		if(!this.renderable.isCurrentAnimation('catch')){
			if(this.animationCount >= 0){
				this.animationCount -= me.timer.tick;			
			}else{
				if(this.image == 'lazyguard3'){
					this.renderable.setCurrentAnimation('yawn', 'stand');
					this.animationCount = 360;
				}else{
					this.animationC = 1 - this.animationC;
					this.renderable.setCurrentAnimation(this.animationArray[this.animationC], 'stand');
					this.animationCount = 180;
				}
				
			}
		}		
		
		if(!spy.stealthOn && spy.alive){	
			//Is the spy in view of the guard?
			if(!this.renderable.isCurrentAnimation('yawn') && this.dangerZoneLeft < spy.right && 
				spy.left < this.dangerZoneRight && 
				this.dangerZoneTop < (spy.bottom - (spy.height * .8 )) &&
				(spy.top + (spy.height * .9 )) < this.dangerZoneBottom){
				spy.caught();
				this.renderable.setCurrentAnimation('catch');
				//check side
				if(this.pos.x > spy.pos.x){
					this.flipX(false);
				}else{
					this.flipX(true);
				}
			}			
		}
		
		if(spy.alive){
			//is Spy close to the guard?
			if(spy.pos.x > this.pos.x - 20 && spy.pos.x < this.pos.x + 12 && 
				spy.pos.y > this.pos.y - 12 && spy.pos.y < this.pos.y + 12){
				me.gamestat.updateValue("dangerCountTemp", .05 * me.timer.tick);
			}
			
			var res = me.game.collide(this);
			if(res && (res.obj.type == me.game.SPY)){
				console.log('Caught!');
				this.addHitSpy();
				spy.caught();
				this.renderable.setCurrentAnimation('catch');
				//check side
				if(this.pos.x > spy.pos.x){
					this.flipX(false);
				}else{
					this.flipX(true);
				}

			}
		}else if(spy.isCaught){
			if(!this.renderable.isCurrentAnimation('catch')){
				this.renderable.setCurrentAnimation('alarmed');
			}
		}
		
		//If spy is in dangerzone and not cloaked, caught!
		this.parent(this);
		return true;
	},
	addHitSpy: function(){
		if(this.pos.x > spy.pos.x){
			var hitX = this.left - 8;
		}else{
			var hitX = this.right - 8;
		}
		
		if(this.pos.y < spy.pos.y){
			var hitY = this.top - ((this.top - spy.bottom)/2) - 8;
		}else{
			var hitY = this.top - ((this.top - spy.bottom)/2) - 8;
		}
		
		//console.log(this.top + ' X' + hitX + ' Y' + hitY)
		
		var hitspy = new HitSpyEntity(hitX, hitY, {image:'hitspy', spritewidth:16, spriteheight: 16 });
		me.game.add(hitspy,this.z + 1);
	}
	
});

/* ---------------------
a security guard booth entity
----------------------*/

var GuardBoothEntity = me.ObjectEntity.extend({
	init:function(x,y,settings){
		this.parent(x,y,settings);
		this.type = me.game.ENEMY_OBJECT;
		this.collidable = false;
		
		//set up bounding box for seeing the spy
		this.dangerZoneTop = y;
		this.dangerZoneBottom = y + settings.height;
		this.dangerZoneLeft = x + 8;
		this.dangerZoneRight = x + settings.width - 8;
		
		//set up animations
		this.renderable.addAnimation('idle',[0,1,2],12);
		this.renderable.addAnimation('catch',[3,4],2);
		this.renderable.setCurrentAnimation('idle');
		
		
	},
	update: function(){
				
		if(!spy.stealthOn && spy.alive){	
			//Is the spy in view of the guard?
			if(this.dangerZoneLeft < spy.right && 
				spy.left < this.dangerZoneRight && 
				this.dangerZoneTop < (spy.bottom - (spy.height * .9 )) &&
				(spy.top + (spy.height * .9 )) < this.dangerZoneBottom){
				spy.caught();
				this.renderable.setCurrentAnimation('catch');
			}			
		}		
		
		//If spy is in dangerzone and not cloaked, caught!
		this.parent(this);
		return true;
	}
	
});


/* ---------------------
a security guard entity
----------------------*/

var GuardEntity = enemyEntity.extend({
	init:function(x,y,settings){
		this.parent(x,y,settings);
		this.type = me.game.ENEMY_OBJECT;
		this.setVelocity(1,0);
		this.collidable = true;
		this.updateColRect(3,10,-1,0);
		//Set Position and walking boundaries
		//Will Check for custom StartX and StopX from Tiled
		if(!settings.marginLeft) settings.marginLeft = 0;
		if(!settings.marginRight) settings.marginRight = 0;		
		this.marginLeft = settings.marginLeft;
		this.marginRight = settings.marginRight;
		this.startX = x + this.marginLeft;
		this.endX = x + settings.width - settings.spritewidth - this.marginRight;				
		
		//Set up delay at end of walk cycle
		this.doDelay = false;
		this.stillTime = 60;
		this.isStill = false;
		
		//set up bounding box for seeing the spy
		this.dangerZoneTop = y;
		this.dangerZoneBottom = y + settings.height;
		this.dangerZoneLeft = x;
		this.dangerZoneRight = x + settings.width;
		
		
		//add animation
		this.renderable.addAnimation('walk', [0,1,2,3],7);		
		this.renderable.addAnimation('catch', [4]);
		this.renderable.addAnimation('stand', [3]);
		this.renderable.setCurrentAnimation('walk');
		this.renderable.addAnimation('alarmed',[5,6],60);
		this.animationspeed = me.sys.fps / 6;
		
		//Start on the right and make walk left
		if(settings.startSide == 'left'){
			this.pos.x = x + this.marginLeft;
			this.walkLeft = false;
			this.flipX(true);
			if(settings.startOffset) this.pos.x += settings.startOffset;
		}else{
			this.pos.x = x + settings.width - settings.spritewidth - this.marginRight;
			this.walkLeft = true;
			this.flipX(false);
			if(settings.startOffset) this.pos.x -= settings.startOffset;
		}
		
		this.startPosX = this.pos.x;
		this.startPosY = this.pos.y;
		this.startFlip = !this.walkLeft;
	},
	update: function(){
		//var caught = false;
		if(this.resetCheck(this.startPosX,this.startPosY,this.startFlip)) return false;
		//console.log(this.inViewport);
		
		if(!this.renderable.isCurrentAnimation('catch') && !this.renderable.isCurrentAnimation('alarmed')){		
			if(this.walkLeft && this.pos.x <= this.startX){
				if(this.doDelay){
					this.renderable.setCurrentAnimation('stand');
					this.isStill = true;
				}else{
					this.flipX(true);
					this.walkLeft = false;
				}
			}else if(!this.walkLeft && this.pos.x >= this.endX){
				if(this.doDelay){
					this.renderable.setCurrentAnimation('stand');
					this.isStill = true;
				}else{
					this.flipX(false);
					this.walkLeft = true;
					
				}
			}
			
			//Delay here if set
			if(this.doDelay){
				if(this.isStill && this.stillTime > 0){
					this.stillTime -= 1;
				}else if(this.stillTime === 0){
					this.isStill = false;
					this.stillTime = 60;
					this.renderable.setCurrentAnimation('walk');
					if(this.walkLeft){
						this.flipX(true);
						this.walkLeft = false;
					}else if(!this.walkLeft){
						this.flipX(false);
						this.walkLeft = true;
					}
				}
			}	
		}
		
		if(!this.renderable.isCurrentAnimation('catch') && !this.renderable.isCurrentAnimation('alarmed') && !this.isStill){
			this.vel.x += (this.walkLeft) ? -this.accel.x * me.timer.tick : this.accel.x * me.timer.tick;
			if(this.renderable.getCurrentAnimationFrame() == 0 || this.renderable.getCurrentAnimationFrame() == 2) me.audio.play('guardstep');
		}else{
			this.vel.x = 0;
		}
		
		this.updateMovement();
		
		//Check here to see if Spy is within the width and height of this entity
		//if(spy.pos.x >= this.dangerZoneLeft && spy.pos.x <= this.dangerZoneRigh && (spy.pos.y >= this.dangerZoneTop) && 
		if(spy.alive){
			//is Spy close to the guard?
			if(spy.pos.x > this.pos.x - 32 && spy.pos.x < this.pos.x + 24 && 
				spy.pos.y > this.pos.y - 12 && spy.pos.y < this.pos.y + 12){
				me.gamestat.updateValue("dangerCountTemp", me.timer.tick);
				//console.log(this.pos.x + " " + spy.pos.x);
			}
			
			if(!spy.stealthOn){
				//Is the spy in view of the guard?
				if(this.dangerZoneLeft < spy.right && 
					spy.left < this.dangerZoneRight && 
					this.dangerZoneTop < (spy.bottom - (spy.height * .9 )) &&
					(spy.top + (spy.height * .9)) < this.dangerZoneBottom){
					if((this.walkLeft && (spy.pos.x <= (this.pos.x + this.width))) || (!this.walkLeft && (spy.pos.x >= (this.pos.x - this.width)))){
						spy.caught();
						this.renderable.setCurrentAnimation('catch');
						//check side
						if(this.pos.x > spy.pos.x){
							this.flipX(false);
						}else{
							this.flipX(true);
						}

					}			
				}
			}else{
				//Also check normal collision, you can't walk through this dude
				var res = me.game.collide(this);
				if(res && (res.obj.type == me.game.SPY)){
					console.log('Caught!');
					this.addHitSpy();
					spy.caught();
					this.renderable.setCurrentAnimation('catch');
					//check side
					if(this.pos.x > spy.pos.x){
						this.flipX(false);
					}else{
						this.flipX(true);
					}

				}
			}
		}else if(spy.isCaught){	
			if(!this.renderable.isCurrentAnimation('catch')){
				this.renderable.setCurrentAnimation('alarmed');
				this.vel.x = 0;
			}
		}
		
		this.parent(this);
		return true;
	},
	addHitSpy: function(){
		if(this.pos.x > spy.pos.x){
			var hitX = this.left - 8;
		}else{
			var hitX = this.right - 8;
		}
		
		if(this.pos.y < spy.pos.y){
			var hitY = this.top - ((this.top - spy.bottom)/2) - 8;
		}else{
			var hitY = this.top - ((this.top - spy.bottom)/2) - 8;
		}
		
		//console.log(this.top + ' X' + hitX + ' Y' + hitY)
		
		var hitspy = new HitSpyEntity(hitX, hitY, {image:'hitspy', spritewidth:16, spriteheight: 16 });
		me.game.add(hitspy,this.z + 1);
	}
});
/* ---------------------
a guard dog entity
----------------------*/

var GuardDogEntity = enemyEntity.extend({
	init: function(x,y,settings){
		console.log('dog');
		this.parent(x,y,settings);
		//Set Collision Rect
		this.updateColRect(7,18,8,24);
		
		this.setVelocity(4,7.5);
		this.setMaxVelocity(4,7.5);
		
		//Set Post Position		
		//Set Run Boundaries
		if(!settings.marginLeft) settings.marginLeft = 0;
		if(!settings.marginRight) settings.marginRight = 0;
		this.marginLeft = settings.marginLeft;
		this.marginRight = settings.marginRight;
		this.startX = x + this.marginLeft;
		this.endX = x + settings.width - settings.spritewidth - this.marginRight;		
		
		//Set Danger Zone
		this.dangerZoneTop = y;
		this.dangerZoneBottom = y + settings.height;
		this.dangerZoneLeft = x;
		this.dangerZoneRight = x + settings.width;
		
		//Animations
		this.renderable.addAnimation('catch',[0,1], 8);
		
		this.renderable.addAnimation('lunge',[8], 12);
		
		this.renderable.addAnimation('alarmed',[0,1], 8);
		this.renderable.addAnimation('lookForward',[0,1], 8);
		this.renderable.addAnimation('lookBackward',[2,3], 8);
		this.renderable.addAnimation('chase',[4,5,6,7],2);
		this.renderable.addAnimation('trot',[4,5,6,7],4);
		//Set FlipX
		this.watchCounter = 120;
		this.chaseCounter = 30;
		this.isChasing = false;
		this.returningToPost = false;
		this.atPost = true;
		this.lookForward = true;
		this.bark = false;
		this.renderable.setCurrentAnimation('lookForward');
		
		//check start side
		if(settings.startSide == 'left'){
			this.startPosX = this.startX;
			this.pos.x = this.startPosX;
			this.walkLeft = false;
			this.flipX(true);
		}else{
			this.startPosX = this.endX;
			this.pos.x = this.startPosX;
			this.walkLeft = true;
			this.flipX(false);
		}
		
		this.startPosX = this.pos.x;
		this.startPosY = this.pos.y;
	},
	update: function(){
		if(this.resetCheck(this.startPosX,this.startPosY)) return false;
		//Dog looks left and right
		
		if(this.watchCounter > 0  && !this.isChasing && !this.returningToPost){
				this.watchCounter -= me.timer.tick;
		}else if(this.watchCounter <= 0 && !this.isChasing && !this.returningToPost){
			this.watchCounter = 120;
			if(this.lookForward){
				this.renderable.setCurrentAnimation('lookBackward');
				this.lookForward = false;
			}else if(!this.lookForward){
				this.renderable.setCurrentAnimation('lookForward');
				this.lookForward = true;
			}
		}
		
		//if spy is in danger zone, run the direction of the spy
		if(spy.alive){
			//is Spy close to the dog?
			if(spy.pos.x > this.pos.x - 52 && spy.pos.x < this.pos.x + 44 && 
				spy.pos.y > this.pos.y - 20 && spy.pos.y < this.pos.y + 20){
				me.gamestat.updateValue("dangerCountTemp", 2 * me.timer.tick);
				//console.log(this.pos.x + " " + spy.pos.x);
			}
			
			//Is the spy in view of the dog?
			if(this.dangerZoneLeft < spy.right && 
				spy.left < this.dangerZoneRight && 
				this.dangerZoneTop < (spy.bottom - (spy.height * .9 )) &&
				(spy.top + (spy.height * .9 )) < this.dangerZoneBottom){
				//Which way should the dog run?
				if(!this.bark){
					me.audio.play("dogbark",false,null,.3); 
					this.bark = true;
				}
				
				if(spy.pos.x < this.pos.x){
					//Run Left
					this.vel.x -= this.accel.x * me.timer.tick;
					this.flipX(false);
				}else if(spy.pos.x > this.pos.x){
					//Run Right
					this.vel.x += this.accel.x * me.timer.tick;
					this.flipX(true);
				}		
				this.isChasing = true;
				this.renderable.setCurrentAnimation('chase');
				
			}else{
				//Continue chasing for a few more frames if was chasing
				if(this.isChasing){
					if(this.chaseCounter > 0){
						if(this.pos.x < this.dangerZoneLeft || this.pos.x > this.dangerZoneRight){
							this.chaseCounter = 0;
						}else{
							this.chaseCounter -= 1 * me.timer.tick;
						}
					}else{
						this.isChasing = false;
						this.chaseCounter = 30;
						//go back to post
						this.returningToPost = true;
					}					
				}
			}
			
			if(this.returningToPost && !this.isChasing){
				//If x pos not at start position
				this.renderable.setCurrentAnimation('trot');
				if(this.pos.x > this.startPosX + 4){	
					this.vel.x = -1.5 * me.timer.tick;
					this.flipX(false);
				}else if(this.pos.x < this.startPosX - 4){
					this.vel.x = 1.5 * me.timer.tick;
					this.flipX(true);
				}else{
					this.bark = false;
					this.vel.x = 0;
					//Snap to start pos
					this.pos.x = this.startPosX;
					this.returningToPost = false;
					this.renderable.setCurrentAnimation('lookForward');
					this.watchCounter = 120;
				}
			}
		}else if(spy.isCaught){	
			console.log('Dog Dog!');
			if(!this.renderable.isCurrentAnimation('lunge')){
				this.renderable.setCurrentAnimation('catch');
				this.vel.x = 0;
				this.isChasing = false;
			}
			/*
			if(!this.renderable.isCurrentAnimation('catch') && !this.renderable.isCurrentAnimation('lunge')){
				this.renderable.setCurrentAnimation('catch');
				this.vel.x = 0;
				this.isChasing = false;
			}else if(this.renderable.isCurrentAnimation('catch') && !this.renderable.isCurrentAnimation('lunge')){
				this.vel.x = 0;
				this.isChasing = false;
			}else{
				this.renderable.setCurrentAnimation('catch');
				this.vel.x = 0;
				this.isChasing = false;
			}
			*/
		}

		this.updateMovement();
		//if spy collides with dog, caught!
		var res = me.game.collide(this);
		
		if(res && res.obj.type == me.game.SPY && spy.alive){
			console.log('caught');
			if( !this.renderable.isCurrentAnimation('lunge')){
				this.renderable.setCurrentAnimation('lunge','catch');
			}
			
			this.isChasing = false;
			//spy.caught();
			
			if(this.pos.x + 8 > spy.pos.x){
				var direction = 'right';
			}else{
				var direction = 'left';
			}
			
			spy.caughtKnockedDown(direction);
			
		}
		
		
		this.parent(this);
		return true;
		
	}
});



/* ---------------------
a tiger entity

works like this:
	has start position, end position and direction
	builds up spring tension for a split second)
	pounces (a jump through the air, quicker than dog)
	lands and flip's x
	repeat
	
	idea is that the player will have to trigger the tiger to get to a key the tiger is guarding

	TODO: check the spy's x pos 
	TODO: instead of using startx and endx, use where the spy last was
	
----------------------*/

var TigerEntity = enemyEntity.extend({
	init: function(x,y,settings){
		this.parent(x,y,settings);
		//Set Collision Rect
		
		this.updateColRect(16,32,4,28);
		//Customize collision rectangle based of of side the tiger faces.
		
		this.anchorPoint.set(0,0);
		
		this.setVelocity(8,7.5);
		this.setMaxVelocity(8,7.5);
		
		//Set Post Position		
		//Set Run Boundaries
		if(!settings.marginLeft) settings.marginLeft = 0;
		if(!settings.marginRight) settings.marginRight = 0;
		this.marginLeft = settings.marginLeft;
		this.marginRight = settings.marginRight;
		this.startX = x + this.marginLeft;
		this.endX = x + settings.width - settings.spritewidth - this.marginRight;
		
		//Set Danger Zone
		this.dangerZoneTop = y;
		this.dangerZoneBottom = y + settings.height;
		this.dangerZoneLeft = x;
		this.dangerZoneRight = x + settings.width;
		
		this.pounceX = 0;
		
		//Animations
		this.renderable.addAnimation('lounge',[0,1,2,1], 12);
		this.renderable.addAnimation('alert',[3,4,5], 8);
		this.renderable.addAnimation('pounce',[9],2);
		this.renderable.addAnimation('charge',[6,7,8],4);

		this.renderable.setCurrentAnimation('lounge');
		
		this.isCharging = false;
		this.isPouncing = false;
		this.isLounging = true;
		this.overshot = false;
		this.roar = false;
		
		this.chargeTime = 15;
		this.chargeCounter = 0;
		
		//check start side
		if(settings.startSide == 'left'){
			this.startPosX = this.startX;
			this.pos.x = this.startPosX;
			this.pounceLeft = false;
			this.flipX(true);
		}else{
			this.startPosX = this.endX;
			this.pos.x = this.startPosX;
			this.pounceLeft = true;
			this.flipX(false);
		}
		
		this.startPosX = this.pos.x;
		this.startPosY = this.pos.y;
	},
	update: function(){
		if(this.resetCheck(this.startPosX,this.startPosY)) return false;
		
		
		//if spy is in danger zone, charge and then pounce in the direction of the spy
		if(spy.alive){
			//Is the spy in view of the tiger?
			if(this.dangerZoneLeft < spy.right && 
				spy.left < this.dangerZoneRight && 
				this.dangerZoneTop < (spy.bottom - (spy.height * .9 )) &&
				(spy.top + (spy.height * .9 )) < this.dangerZoneBottom){
				
				if(this.isLounging){
					this.isCharging = true;
					this.isLounging = false;
				}

				if(this.isCharging){					
					if(this.chargeCounter < this.chargeTime){
						this.renderable.setCurrentAnimation('charge');
						this.chargeCounter += 1 * me.timer.tick;
					}else{
						console.log(this.chargeCounter);
						this.chargeCounter = 0;
						this.isCharging = false;
						this.isPouncing = true;
					}				
				}
				
				//
				this.pounceX = spy.pos.x;
				
				
			}else{
				if(!this.isPouncing){
					this.isLounging = true;
					this.renderable.setCurrentAnimation('lounge');
				}
			}
			
			
			//When pouncing, tiger doesn't stop until it reaches it's end pos x
			if(this.isPouncing){
				console.log('pounce');
				if(!this.roar){
					me.audio.play("tigerroar",false,null,.5); 
					this.roar = true;
				}
				this.renderable.setCurrentAnimation('pounce');
				
				//check start/end x pos, stop pounce there
				if(this.pounceLeft){
					if(this.pos.x <= this.pounceX - 8 || this.overshot){ //overshoot by a little here?
						this.pounceLeft = false;
						this.vel.x = 0;
						this.flipX(true);
						this.renderable.setCurrentAnimation('lounge');
						this.isLounging = true;
						this.isPouncing = false;
						this.overshot = false;
						this.roar = false;
					}else{
						this.vel.x -= this.accel.x * me.timer.tick;
						//this.flipX(false);
						console.log(this.vel.x);
					}
				}else{
					if(this.pos.x >= this.pounceX + 8 || this.overshot){
						this.pounceLeft = true;
						this.vel.x = 0;
						this.flipX(false);
						this.renderable.setCurrentAnimation('lounge');
						this.isLounging = true;
						this.isPouncing = false;
						this.overshot = false;
						this.roar = false;
					}else{
						this.vel.x += this.accel.x * me.timer.tick;
						//this.flipX(true);						
					}
				}				
			}			
		}
		
		//Move and check to see if colliding with wall
		var collision = this.updateMovement();
		if(collision.x && collision.xprop.isSolid){
			this.overshot = true;
		}
		
		
		//Roll my own collision here
		
		var res = me.game.collide(this);
		
		if(res && res.obj.type == me.game.SPY && spy.alive){
			console.log('caught');
			this.renderable.setCurrentAnimation('alert');
			this.vel.x = 0;
			this.isChasing = false;
			
			if(this.pos.x + 16 > spy.pos.x){
				var direction = 'right';
			}else{
				var direction = 'left';
			}
			
			spy.caughtKnockedDown(direction);
		}
		
		
		this.parent(this);
		return true;
		
	}
});


/* ---------------------
a security camera entity
----------------------*/
var SecurityCameraEntity = me.ObjectEntity.extend({
	init:function(x,y,settings){
		this.parent(x,y,settings);
		//position camera
		this.anchorPoint.set(0,0);
		
		this.pos.x = (!settings.offSetX) ? x : x + settings.offSetX;
		//set up bounding box for seeing the spy
		this.dangerZoneTop = y;
		this.dangerZoneBottom = y + settings.height;
		this.dangerZoneLeft = x + (settings.spritewidth * 2);
		this.dangerZoneRight = x + settings.width;
		
		//Set up delay before turning
		this.doDelay = true;
		this.stillTime = 180;
		this.isStill = false;
		
		if(settings.startSide == 'right'){
			this.lookLeft = false;
		}else{
			this.lookLeft = true;
		}
		this.flipX(this.lookLeft);
		
		//Animations
		this.animationspeed = me.sys.fps / 6;
		this.renderable.addAnimation('stationary',[0],0);
		this.renderable.addAnimation('blink',[0,1],4);
		this.renderable.addAnimation('solid',[1],4);
		this.renderable.addAnimation('rotate',[2],8);
		this.renderable.setCurrentAnimation('stationary');
		
	},
	update:function(){
		if(!this.inViewport) return false;
		//Delay here if set
		if(this.doDelay){
			
			if(this.stillTime > 0){
				this.stillTime -= me.timer.tick;
				if(this.stillTime < 80){
					if(this.stillTime < 40){
						this.renderable.setCurrentAnimation('solid');
					}else{
						this.renderable.setCurrentAnimation('blink');
					}
				}
			}else if(this.stillTime <= 0){
				this.stillTime = 180;
				if(this.lookLeft){
					this.flipX(false);
					this.lookLeft = false;
				}else if(!this.lookLeft){
					this.flipX(true);
					this.lookLeft = true;
				}
				console.log('Camera flip');
				me.audio.play("cameraturn"); 
				this.renderable.setCurrentAnimation('rotate','stationary');
			}
		}	
			
		//check to see if spy is in view of the camera (if spy is not invisible)
		if(!spy.stealthOn && spy.alive && !this.renderable.isCurrentAnimation('rotate')){	
			//Is the spy in view of the camera?
			if(this.dangerZoneLeft < spy.right && 
				spy.left < this.dangerZoneRight && 
				this.dangerZoneTop < (spy.bottom - (spy.height * .9 )) &&
				(spy.top + (spy.height * .9 )) < this.dangerZoneBottom){
				//Create a deadzone under the camera and if the camera is not looking at the spy
				if((this.lookLeft && (spy.pos.x <= (this.pos.x - this.width))) || (!this.lookLeft && (spy.pos.x >= (this.pos.x + this.width)))){
					spy.caught();
				}
			}
		}
		
		this.parent(this);
		return true;
	}
});

/* ---------------------
a security camera bot entity
----------------------*/

var SecurityCameraBotEntity = SecurityCameraEntity.extend({
	init: function(x,y,settings){
		this.parent(x,y,settings);
		this.setVelocity(.4,0);
		this.setMaxVelocity(.4,0);
		this.gravity = 0;
		this.startX = x;
		this.endX = x + settings.width - settings.spritewidth;
		this.walkLeft = false;
		this.pos.y += 4;
		this.hoverCounter = 0;
		this.hoverUp = true;
		this.renderable.addAnimation('stationary',[0,1],2);
		this.renderable.addAnimation('blink',[3,4],2);
		this.renderable.addAnimation('rotate',[2],8);
		
		this.renderable.setCurrentAnimation('stationary');
		
		if(settings.startSide == 'right'){
			this.pos.x = x + settings.width - settings.spritewidth;
			this.walkLeft = true;
		}else{
			this.pos.x = x;
			this.walkLeft = false;
		}
		
		
	},update:function(){
		//console.log(this.pos.x);
		//move back and forth
		if (this.walkLeft && Math.floor(this.pos.x) <= this.startX) {
			this.walkLeft = false;
		} else if (!this.walkLeft && Math.ceil(this.pos.x) >= this.endX) {
			this.walkLeft = true;
		}
		
		//step through moving on y
		if(this.hoverUp){
			this.pos.y += .1 * me.timer.tick;
			this.hoverCounter += me.timer.tick;
			if(this.hoverCounter >= 30){
				this.hoverUp = false;
			}
		}else if(!this.hoverUp){
			this.pos.y -= .1 * me.timer.tick;
			this.hoverCounter -= me.timer.tick;
			if(this.hoverCounter <= 0){
				this.hoverUp = true;
			}
		}
		
		
		this.vel.x += (this.walkLeft) ? -this.accel.x * me.timer.tick : this.accel.x * me.timer.tick;
		this.updateMovement();
		
		this.updateMovement();
		this.parent(this);
		return true;
	}	
});

/* ---------------------
a security bot entity
----------------------*/
var SecurityBotEntity = me.ObjectEntity.extend({
	init:function(x,y,settings){
		this.parent(x,y,settings);
		this.setVelocity(2,2);
		//this.collidable = true;
		this.updateColRect(2,settings.spritewidth-4,2,settings.spritewidth-4);
		this.gravity = 0;
		this.botType = (!settings.bottype) ? false : settings.bottype;
		//Start with box/perimeter movement	
		//Will Check for custom StartX and StopX from Tiled
		
		this.marginLeft = (!settings.marginLeft) ? 0 : settings.marginLeft;
		this.marginRight = (!settings.marginRight) ? 0 : settings.marginRight;
		this.marginTop = (!settings.marginTop) ? 0 : settings.marginTop;
		this.marginBottom = (!settings.marginBottom) ? 0 : settings.marginBottom;
		
		//Start X and Start Y
		//End X and End Y
		//this.startX = x + this.marginLeft;
		//this.endX = x + settings.width - settings.spritewidth - this.marginRight;		
		
		//These are the overall bounding box
		this.startX = x;		
		this.endX = x + settings.width - settings.spritewidth;		
		this.startY = y;
		this.endY = y + settings.height - settings.spritewidth;
		
		//These determine the box for which the bot moves in
		this.startXm = this.startX + this.marginLeft;		
		this.endXm = this.endX - this.marginRight;		
		this.startYm = this.startY + this.marginTop;
		this.endYm = this.endY - this.marginBottom;
		
		this.pos.x = this.startXm;
		this.pos.y = this.startYm;
		
		this.spritewidth = settings.spritewidth;
		this.spriteheight = settings.spriteheight;
		this.spritewidthA = settings.spritewidth / 2 ;
		this.spriteheightA = settings.spriteheight / 2;
		//
		this.walkLeft = false;
		this.walkUp = false;
		this.moveX = false;
		
		//set up animations
		this.renderable.addAnimation('moveX',[4,5,6,7],8);
		this.renderable.addAnimation('moveDown',[0,1,2,3]);
		
		this.doFlipY = false;
		if(this.botType == 'laser'){
			this.renderable.addAnimation('moveUp',[0,1,2,3]);
			this.doFlipY = true;
			
			//attach the laser beam
			//console.log(this.pos.x + 16);
			/*
			botBeam = new BotBeamEntity(this.pos.x + 16, this.pos.y + 7, {startX:x,endX:x + settings.width,startY:y,endY:y + settings.height,botwidth: settings.spritewidth});
			me.game.add(botBeam,4);
			me.game.sort();
				*/
				
		}else{
			
			this.renderable.addAnimation('moveUp',[8,9,10,11]);
		}	
		
		this.renderable.setCurrentAnimation('moveX');
		this.flipX(true);
	},
	update: function(){
		//Move around in a square pattern
		
		//Determine if it should be moving on the x axis or the y axis
		if(this.moveX && (this.pos.x <= this.startXm || this.pos.x >= this.endXm)){
			this.moveX = false;			
		}else if(!this.moveX && (this.pos.y <= this.startYm || this.pos.y >= this.endYm)){
			this.moveX = true;
		}
		
		//console.log(this.moveX,this.pos.x, this.startX, this.endX, this.pos.y, this.startY, this.endY);
		
		//Determine whether it should move left or right, up or down
		if(this.moveX){
			this.renderable.setCurrentAnimation('moveX');
			//set appropriate x and y vel
			if(this.walkLeft && this.pos.x <= this.startXm){
				this.flipX(true);
				this.walkLeft = false;
			}else if(!this.walkLeft && this.pos.x >= this.endXm){
				this.flipX(false);
				this.walkLeft = true;
			}
			this.vel.x += (this.walkLeft) ? -this.accel.x * me.timer.tick : this.accel.x * me.timer.tick;
			this.vel.y = 0;
		}else{
			//set appropriate x and y vel
			if(this.walkUp && this.pos.y <= this.startYm){
				this.flipY(false);
				this.walkUp = false;
			}else if(!this.walkUp && this.pos.y >= this.endYm){
				//this.flipY(false);
				this.walkUp = true;
				this.flipY(this.doFlipY);
			}
			
			(this.walkUp) ? this.renderable.setCurrentAnimation('moveUp') : this.renderable.setCurrentAnimation('moveDown');
			
			this.vel.y += (this.walkUp) ? -this.accel.y * me.timer.tick : this.accel.y * me.timer.tick;
			//this.vel.y -= this.accel.y * me.timer.tick;
			this.vel.x = 0;
			//console.log(this.moveX);
			//console.log(this.vel.y);
		}		

		//If the spy is in bot's box, caught
		//If spy collides with bot, caught
		if(spy.alive){
			if(spy.stealthOn){
				//check for danger zone
			}
			
			//check for collision
			var res = me.game.collide(this);
		
			if(res && res.obj.type == me.game.SPY && spy.alive){
				console.log(res);
				spy.caught();
			}
			
		}else{
			
		}
	
		this.updateMovement();
		this.parent(this);
		return true;
	},draw: function(context){
		this.parent(context);
	},
	straightPattern: function(){
	},
	squarePattern: function(){
	}
});

var LaserBotEntity = SecurityBotEntity.extend({
	init: function(x,y,settings){
		this.parent(x,y,settings);
		//set up dangerzones
		this.dzX1 = 0;
		this.dzX2 = 0;
		this.dzY1 = 0;
		this.dzY2 = 0;
		
		this.flickerC = 0;
		this.flikcerColor = ['rgba(255,0,0,0.5)','rgba(224,0,0,0.9)'];
	},
	update: function(){
		//Custom Collision Here
		
		if(spy.alive){
			//
			if(!this.walkLeft && this.moveX){//if moving x at the top
				this.dzX1 = this.pos.x + this.spritewidth;
				this.dzX2 = this.endX + this.spritewidth;
				this.dzY1 = this.pos.y+this.spriteheightA;
				this.dzY2 = this.pos.y+this.spriteheightA;
			}else if(this.walkLeft && this.moveX){	//if moving x at the bottom
				this.dzX2 = this.pos.x;
				this.dzX1 = this.startX;
				this.dzY1 = this.pos.y+this.spriteheightA;
				this.dzY2 = this.pos.y+this.spriteheightA;
			}else if(this.walkUp && !this.moveX){//if moving y at the right
				this.dzX1 = this.pos.x+this.spriteheightA;
				this.dzX2 = this.pos.x+this.spriteheightA;
				this.dzY2 = this.pos.y;
				this.dzY1 = this.startY;
			}else if(!this.walkUp && !this.moveX){	//if moving y at the left
				this.dzX1 = this.pos.x+this.spriteheightA;
				this.dzX2 = this.pos.x+this.spriteheightA;
				this.dzY1 = this.pos.y + this.spriteheight;
				this.dzY2 = this.endY + this.spriteheight;
			}
		
			//console.log(this.dzX1,	this.dzX2, this.dzY1, this.dzY2);
			
			//Is the spy intersecting the laser?
			
			if(this.dzX1 < (spy.right - 4) && 
					(spy.left + 4) < this.dzX2 && 
			this.dzY1 < (spy.bottom - 4) &&
			((spy.top + 4) < this.dzY2)){
				spy.caught();			
			}
		}
		
		this.parent(this);
		return true;
	},draw: function(context){
		this.parent(context);
		context.beginPath();
		context.lineWidth = 2;
		
		if(!this.walkLeft && this.moveX){//if moving x at the top
			context.moveTo(this.pos.x + this.spritewidth - 2,this.pos.y+this.spriteheightA); 
			context.lineTo(this.endX + this.spritewidth,this.pos.y+this.spriteheightA); 
		}else if(this.walkLeft && this.moveX){	//if moving x at the bottom
			context.moveTo(this.pos.x + 2,this.pos.y+this.spriteheightA); 
			context.lineTo(this.startX,this.pos.y+this.spriteheightA); 
		}else if(this.walkUp && !this.moveX){//if moving y at the right
			context.moveTo(this.pos.x+this.spriteheightA,this.pos.y + 2); 
			context.lineTo(this.pos.x+this.spriteheightA,this.startY); 
		}else if(!this.walkUp && !this.moveX){	//if moving y at the left
			context.moveTo(this.pos.x+this.spriteheightA,this.pos.y + this.spriteheight - 2); 
			context.lineTo(this.pos.x+this.spriteheightA,this.endY + this.spriteheight); 
		}
		
		//#fb2c2c
		this.flickerC = 1 - this.flickerC;
		context.strokeStyle = this.flikcerColor[this.flickerC];
		//console.log(this.flikcerColor[this.flickerC]);
		context.stroke();  
		context.closePath();
	}
});

/* ---------------------
a security beam entity
----------------------*/
var SecurityBeamEntity = enemyEntity.extend({
	init:function(x,y,settings){
		this.parent(x,y,settings);
		this.collidable = true;
		this.updateColRect(4,8,2,28);
		//Needs to be faster than invisible speed of spy
		this.setVelocity(2.5,0);
		
		//Check for and set a startDelay (in frames)
		this.startDelay = (settings.startDelay) ? settings.startDelay : 0;		
		this.startDelayCounter = 0;
		
		//Set it up to move back and forth
		this.startX = x;
		this.endX = x + settings.width - settings.spritewidth;		
		
		if(settings.startSide == 'left'){
			this.pos.x = this.startX;
			this.walkLeft = false;
		
		}else{
			this.pos.x = x + settings.width - settings.spritewidth;
			this.walkLeft = true;
		}
		this.startPosX = this.pos.x;
		this.startPosY = this.pos.y;
		
		this.renderable.addAnimation('beam', [0]);
	},
	update:function(){
		if(this.resetCheck(this.startPosX,this.startPosY)) return false;
		
		//Start Delay
		if(this.startDelay){
			this.startDelayCounter += me.timer.tick;
			if(this.startDelayCounter < this.startDelay){
				this.parent(this);
				return true;
			}else{
				this.startDelay = false;
			}
		}
		
		
		//move back and forth
		if (this.walkLeft && this.pos.x <= this.startX) {
			this.walkLeft = false;
		} else if (!this.walkLeft && this.pos.x >= this.endX) {
			this.walkLeft = true;
		}
		
		this.vel.x += (this.walkLeft) ? -this.accel.x * me.timer.tick : this.accel.x * me.timer.tick;
		this.updateMovement();
		
		var res = me.game.collide(this);
		
		if(spy.alive && !spy.isCaught && res && res.obj.type == me.game.SPY){
			console.log('caught');
			
			if(this.walkLeft){
				direction = 'right';
			}else{
				direction = 'left';
			}
			
			spy.caughtBeam(direction);
			
			//spy.caught();
		}
		
		this.parent(this);
		return true;
		
	}
});

/* ---------------------
a pressure plate entity
----------------------*/
var PressurePlateEntity = me.ObjectEntity.extend({
	init:function(x,y,settings){
		this.parent(x,y,settings);
		this.collidable = true;
		this.updateColRect(2,12,-4,4);
		this.pressureSen = 50;
		this.renderable.addAnimation('normal',[0]);
		//this.renderable.addAnimation('armed',[0,2,0,3,0,4,0]);
		this.renderable.addAnimation('armed',[1,2,3,4,5,6,7]);
		this.renderable.addAnimation('triggered',[0,7])
		
		//this.isSet = false;
		this.isArmed = false;
		this.isTriggered = false;
		this.renderable.setCurrentAnimation('normal');
		this.animationSpeed = me.sys.fps / 3;
	},
	update:function(){
		//Check for Collision with spy if spy is alive
		if(spy.alive){
			var res = me.game.collide(this);
			if(res && (res.obj.type == me.game.SPY)){
				if(!this.isArmed && !this.isTriggered){
					//Some good sounds here would be good
					this.isArmed = true;
					this.renderable.setCurrentAnimation('armed');
					this.renderable.setAnimationFrame(0);
				}else{
					this.pressureSen -= 1 * me.timer.tick;
				}
				//If pressure sensitivity is reach or if the spy landed on this, trigger
				if(this.pressureSen <= 0 || spy.wasFalling){
					this.isTriggered = true;
					this.renderable.setCurrentAnimation('triggered');
					spy.caught();
				}
			}else{
				//Maybe build in a cool down time
				this.isArmed = false;
				this.pressureSen = 50;
				this.renderable.setCurrentAnimation('normal');
			}
		}
		this.parent(this);
		return true;
	}
});

/* ---------------------
a motion sensor entity
----------------------*/
var MotionSensorEntity = me.ObjectEntity.extend({
	init:function(x,y,settings){
		this.parent(x,y,settings);
		this.collidable = true;
		this.updateColRect(2,28,0,1);
		//Needs to be faster than invisible speed of spy
		this.setVelocity(0,.5);
		this.gravity = 0;
		//Set it up to move back and forth
		this.startX = x;
		this.endX = x + settings.width;
		this.midX = x + 16;
		this.startY = y + 2;
		this.endY = y + settings.height - settings.spriteheight;
		if(settings.startPos == 'top'){
			this.pos.y = y;
			this.moveUp = false;
		
		}else{
			this.pos.y = y + settings.height - settings.spriteheight;
			this.moveUp = true;
		}
		
		this.renderable.flicker();
		
		this.flickerC = 0;
		this.flikcerColor = ['rgba(255,0,0,0.05)','rgba(224,0,0,0.2)'];
		
		//this.renderable.addAnimation('beam', [0,1]);
		//this.renderable.setCurrentAnimation('beam');
	},
	update:function(){
		//move up and down
		//	
		if(!this.inViewport) return false;
		
		if (this.moveUp && this.pos.y <= this.startY) {
			this.moveUp = false;
		} else if (!this.moveUp && this.pos.y >= this.endY) {
			this.moveUp = true;
		}
		
		this.vel.y += (this.moveUp) ? -this.accel.y * me.timer.tick : this.accel.y * me.timer.tick;
		this.updateMovement();
		
		var res = me.game.collide(this);
		
		if(res && res.obj.type == me.game.SPY && spy.alive && spy.moving){
			spy.caught();
		}
		
		this.parent(this);
		return true;
		
	},
	draw: function(context){
		this.parent(context);
		this.flickerC = 1 - this.flickerC;
		
		//main beam
		/* We'll use this if we decide to get rid of the old beam
		context.beginPath();
		context.lineWidth = 1;			
		context.moveTo(this.endX, this.pos.y); 
		context.lineTo(this.pos.x, this.pos.y);			
		context.strokeStyle = this.flikcerColor[this.flickerC];
		context.stroke();  
		context.closePath();
		*/
		
		/*
		//Left Side
		context.beginPath();
		context.lineWidth = 1;			
		context.moveTo(this.midX, this.startY); 
		context.lineTo(this.pos.x, this.pos.y);			
		context.strokeStyle = this.flikcerColor[this.flickerC];
		context.stroke();  
		context.closePath();
		
		//Right Side
		context.beginPath();
		context.lineWidth = 1;			
		context.moveTo(this.midX, this.startY); 
		context.lineTo(this.pos.x + 32, this.pos.y);			
		context.strokeStyle = this.flikcerColor[this.flickerC];
		context.stroke();  
		context.closePath();
		*/
		
		//Let's draw a triangle
		if(this.inViewport){
			context.fillStyle = this.flikcerColor[this.flickerC];
			context.beginPath();
			context.moveTo(this.midX, this.startY);
			context.lineTo(this.pos.x, this.pos.y);	
			context.lineTo(this.pos.x + 32, this.pos.y);	
			context.moveTo(this.midX, this.startY);
			context.strokeStyle = this.flikcerColor[this.flickerC];
			context.stroke();  
			context.closePath();
			context.fill();
		}

	}
});

/* ---------------------
a motion sensor monitor entity
----------------------*/
var MotionSensorMonitorEntity = me.ObjectEntity.extend({
	init:function(x,y,settings){
		this.parent(x,y,settings);
		this.collidable = false;
		this.pos.x += 8;
		this.renderable.addAnimation('monitor', [0,1,2,3,4,5,6,7,8,9]);
		this.renderable.setCurrentAnimation('monitor');
	},
	update:function(){
		this.parent(this);
		return true;
		
	}
});

/* ---------------------
an assassin entity
----------------------*/
var AssassinEntity = enemyEntity.extend({
	init: function(x,y,settings){
		this.parent(x,y,settings);
		//start position
		//danger zone
		this.isCloaked = true;
		this.sawSpy = false;
		//Set Collision Rect
		this.updateColRect(7,18,8,24);
		
		this.setVelocity(1,7.5);
		this.setMaxVelocity(1,7.5);
		
		//Set Post Position		
		//Set walk Boundaries
		if(!settings.marginLeft) settings.marginLeft = 0;
		if(!settings.marginRight) settings.marginRight = 0;
		this.marginLeft = settings.marginLeft;
		this.marginRight = settings.marginRight;
		this.startX = x + this.marginLeft;
		this.endX = x + settings.width - settings.spritewidth - this.marginRight;		
		
		//Set Danger Zone
		this.dangerZoneTop = y;
		this.dangerZoneBottom = y + settings.height;
		this.dangerZoneLeft = x;
		this.dangerZoneRight = x + settings.width;
		
		//Animations
		this.renderable.addAnimation('uncloak',[9,8,7,6],4);
		this.renderable.addAnimation('cloak',[6,7,8,9,10],4);
		this.renderable.addAnimation('stalk',[0,1,2,3,4,5],8);
		this.renderable.addAnimation('stand',[0],8);
		this.renderable.addAnimation('cloaked',[10]);
		
		this.renderable.setCurrentAnimation('cloaked');
		
		//Set FlipX
		this.flipX(false);
		
		if(settings.startSide == 'left'){
			this.pos.x = this.startX;
			this.walkLeft = false;
		
		}else{
			this.pos.x = this.endX;
			this.walkLeft = true;
		}
		
		this.startPosX = this.pos.x;
		this.startPosY = this.pos.y;
	},
	update: function(){
		if(this.resetCheck(this.startPosX,this.startPosY)) return false;		
		
		//if spy is in danger zone, run the direction of the spy
		if(spy.alive){
			
			//Is the spy in view of the assassin?
			if(this.dangerZoneLeft < spy.right && 
				spy.left < this.dangerZoneRight && 
				this.dangerZoneTop < (spy.bottom - (spy.height * .9 )) &&
				(spy.top + (spy.height * .9 )) < this.dangerZoneBottom){
				if(!spy.stealthOn){
					this.sawSpy = true;
				}
				//Is the Spy facing the assassin?
				if( this.sawSpy && ((this.pos.x > spy.pos.x && !spy.currentDirection) || (this.pos.x < spy.pos.x && spy.currentDirection))){
					//check to see if cloaked, uncloak and stalk
					if(this.isCloaked){
						this.renderable.setCurrentAnimation('uncloak','stalk');
						this.isCloaked = false;
					}
					
					if(!this.renderable.isCurrentAnimation('uncloak')){
					
						if(spy.pos.x < this.pos.x){
							//Run Left
							this.vel.x -= this.accel.x * me.timer.tick;
							this.flipX(true);
						}else if(spy.pos.x > this.pos.x){
							//Run Right
							this.vel.x += this.accel.x * me.timer.tick;
							this.flipX(false);
						}
					
					}
				
				}else{
					//check to see if not cloaked, cloak
					if(!this.isCloaked){
						this.renderable.setCurrentAnimation('cloak','cloaked');
					}
					this.isCloaked = true;
					
					this.vel.x = 0;
				}				
				
			}else{
				//cloak up
				//check to see if not cloaked, cloak
				if(!this.isCloaked){
					this.renderable.setCurrentAnimation('cloak','cloaked');
					this.isCloaked = true;
				}				
				this.vel.x = 0;
			}			
		}

		this.updateMovement();
		
		//if spy collides with dog, caught!
		if(!this.isCloaked){
			var res = me.game.collide(this);
			
			if(!this.isCloaked && res && res.obj.type == me.game.SPY && spy.alive){
				console.log('caught');
				//this.renderable.setCurrentAnimation('lookForward');
				this.vel.x = 0;
				spy.caught();
				this.renderable.setCurrentAnimation('stand');
			}
		}
		
		this.parent(this);
		return true;
	}
});

/* ---------------------
a You Lost entity
----------------------*/
//Display You Lost message, on key press 'R' retry the level
var YouLostMSGEntity = me.ObjectEntity.extend({
	init:function(x,y){
		settings.height = 240;
		settings.width = 320;
		this.alwaysUpdate = true;
		this.parent(x,y,settings);
		//Load the font
		this.font = new me.BitmapFont('8x8PressStartP2',8);
		//this.msg1 = "YOU GOT CAUGHT!";
		this.msg1 = "";
		//this.msg1Width = (this.font.measureText(this.msg1)).width;
		//console.log(this.msg1Width);
		
		//TODO: Need to take into all directions
		var textPosX = Math.floor(me.game.viewport.pos.x/320.0) * 320;
		
		var red_alert = new CutSceneActorEntity(textPosX, me.game.viewport.pos.y, {image: 'red_alert', spritewidth:320, spriteheight:240});
		me.game.add(red_alert,90);
		me.game.sort();
		
		var caught_msg = new CutSceneActorEntity(textPosX + 110, me.game.viewport.pos.y + 90, {image: 'caught_msg', spritewidth:100, spriteheight:50, loop: 'once',frames:9, animationSpeed:1});
		me.game.add(caught_msg,100);
		me.game.sort();
		
		
		this.msgCounter = 0;
		this.msgTime = 15;
		this.msgDrawn = false;
		
		this.msg = "PRESS <R> TO RETRY!";
					
		//Enable Spacebar (common jump key) to restart
		//me.input.bindKey(me.input.KEY.SPACE, "retry", true);
		this.retryEnabled = false;
	},
	update:function(){
		//console.log(me.game.viewport.pos.x);
		
		if(this.msgCounter <= this.msgTime){
			this.msgCounter += 1*me.timer.tick;
		}else{
			if(!this.retryEnabled){
				//Enable Spacebar (common jump key) to restart
				me.input.bindKey(me.input.KEY.SPACE, "retry", true);
				this.retryEnabled = true;
			}
			
			if(!this.msgDrawn){
				this.msgWidth = this.font.measureText(context,this.msg).width;
				
				console.log(me.game.viewport.pos.x + me.game.viewport.width/2 - this.msgWidth/2);
				
				var text = new CutSceneTextEntity(0, 0, {msg:this.msg,textPos:"center",textPosX: me.game.viewport.width/2 - this.msgWidth/2, textPosY: 140});
					me.game.add(text,100);
					me.game.sort();	
				this.msgDrawn = true;
			}
		}
		
		if(me.input.isKeyPressed('retry')){
			me.game.remove(this);
		}
	},
	draw: function(context){
		//console.log(context);
		//Display Two Lines: You lost, Retry
		/*
		
		this.msg1Width = this.font.measureText(context,this.msg1).width;
		this.msg2Width = this.font.measureText(context,this.msg2).width;	
		
		//console.log(me.game.viewport.pos.x + me.game.viewport.width/2 - this.msg1Width/2);
		this.font.draw(context,
			this.msg1,me.game.viewport.pos.x + me.game.viewport.width/2 - this.msg1Width/2,
			80);
		this.font.draw(context,
			this.msg2,me.game.viewport.pos.x + me.game.viewport.width/2 - this.msg2Width/2,
			140);
			//96
		//Hint Message
		//Try Standing Still
		
		*/
		
	},
	onDestroyEvent: function(){
		me.input.bindKey(me.input.KEY.SPACE, "jump", true);
	}
});


/* ---------------------
a background sprite entity
----------------------*/
var BackgroundSpriteEntity = me.ObjectEntity.extend({
	init:function(x,y,settings){
		this.parent(x,y,settings);
		this.collidable = false;
		this.isPlaying = true;
		this.startPosY = this.pos.y;
		(settings.lockToCameraY) ? this.lockToCameraY = settings.lockToCameraY : this.lockToCameraY = false;
		(settings.animationSpeed) ? this.animationSpeed = settings.animationSpeed : this.animationSpeed = 16;
		//this.renderable.animationspeed = me.sys.fps / 1; //6
		
		this.renderable.addAnimation('defaultAnim', null, this.animationSpeed);
		
		/* Hmm...I think this should be below
		if(settings.startframe != ''){
			this.renderable.setAnimationFrame(0);
		}
		*/
		
		//default delay to random if not set
		if(settings.delay == 'none' || settings.delay === 0){
			this.delay = 0;
		}else{			
			if(settings.delay == null){
				this.delay = 20 + Math.floor(Math.random()*11);
			}else{
				this.delay = settings.delay;
			}
		}		
		
		this.timer = 0;
		if(this.delay > 0){
			this.renderable.alpha = 0;
			this.isPlaying = false;
			this.renderable.setCurrentAnimation('default', function() {this.delayAnim()}.bind(this));
			console.log('test 1');
		}else{
			this.renderable.setCurrentAnimation('defaultAnim');
			this.delay = 0;
			console.log('test');
		}
		
		if(this.lockToCameraY){
			this.handle = me.event.subscribe(me.event.VIEWPORT_ONCHANGE, this.updatePosY.bind(this));
		}
		
		if(settings.startframe != ''){
			this.renderable.setAnimationFrame(settings.startframe);
		}
		
	},
	update:function(){
			
		if(!this.isPlaying && this.delay > 0){
			if(this.timer < this.delay){
				this.timer += 1*me.timer.tick;
			}else{
				this.timer = 0;
				this.isPlaying = true;
				this.renderable.alpha = 1;
				this.renderable.setCurrentAnimation('defaultAnim', function() {this.delayAnim()}.bind(this));
			}
		}
		
		if(this.lockToCameraY){
			//console.log(this.startPosY  + me.game.viewport.pos.y + ' ' + this.pos.y);
			//this.pos.y = this.startPosY  + me.game.viewport.pos.y;
			//console.log('Viewport pos y 3:' + me.game.viewport.pos.y);
			
		}
		
		this.parent(this);
		return true;	
	},
	updatePosY:function(vpos){
		this.pos.y = this.startPosY  + vpos.y;
	},
	delayAnim:function(){
		this.renderable.alpha = 0;
		this.isPlaying = false;
	}
});


/* ---------------------
a camera entity
----------------------*/
var CameraEntity = me.ObjectEntity.extend({
	init:function(x,y){
		settings = {};
        settings.width = 0;
        settings.height = 0;
		this.parent(x,y,settings);
		this.alwaysUpdate = true;
		//viewport width
		//get map width	
		//console.log(me.game.currentLevel.tilewidth, me.game.currentLevel.width);
		this.cameraWidth = me.game.viewport.getWidth();
		this.cameraHeight = me.game.viewport.getHeight();
		//get map height
		//determine amount of sectors
		//Start on the Spy
		this.startGame = true;
		this.transitioning = false;
		this.defaultScale = 1;
		this.currentScale = 1;
		this.maxScale = 1.05;
		context = me.video.getScreenContext();
		//context.save();
		//context.scale(1.8, 1.8);
		//context.restore();
		//context.setTransform(1.5, 1.5,0,0,0,0);
		//me.video.scale(me.video.getScreenContext(), this.defaultScale);
		
		
		this.mapHeight = me.TMXTileMap.rows * me.TMXTileMap.tileheight;
		this.mapWidth = me.TMXTileMap.cols * me.TMXTileMap.tilewidth;
		//me.game.viewport.setBounds(mapWidth,mapHeight);
	
	},
	update:function(){
		//check the position of the spy
		//update the viewport accordingly
		//Don't need to run if map is only 1 section big
		
		//Zooming code - might not use here
		if(this.currentScale < this.maxScale){
			//this.currentScale += 0.01;
			//me.video.scale(me.video.getScreenContext(), this.currentScale); 
		}else{
		}
		
		if(this.startGame){
			if(spy.pos.x + 16 < me.game.viewport.pos.x){ 
				testx = (Math.floor(spy.pos.x/this.cameraWidth) * this.cameraWidth);
				me.game.viewport.pos.x = testx;
			}else if((spy.pos.x + 8) > (me.game.viewport.pos.x + this.cameraWidth)){
				testx = (Math.floor((spy.pos.x + 8)/this.cameraWidth) * this.cameraWidth);
				me.game.viewport.pos.x = testx;
			}
			
			if((spy.pos.y + 12) > (me.game.viewport.pos.y + this.cameraHeight)){
				testy = (Math.floor((spy.pos.y + 8)/this.cameraHeight) * this.cameraHeight);
				me.game.viewport.pos.y = testy;
			}else if((spy.pos.y + 12) < (me.game.viewport.pos.y + this.cameraHeight)){
				testy = (Math.floor((spy.pos.y + 8)/this.cameraHeight) * this.cameraHeight);
				me.game.viewport.pos.y = testy;
			}
			
			this.startGame = false;
		}
		
		if(spy.alive && !this.transitioning){ //can't use visible since we want the camera to move a little before in some instances
			
			if(spy.pos.x + 12 < me.game.viewport.pos.x){ //Pan Left
				testx = (Math.floor(spy.pos.x/this.cameraWidth) * this.cameraWidth);
				tween = new me.Tween(me.game.viewport.pos).to({x:testx}, 600);
				tween.easing(me.Tween.Easing.Quartic.Out);
				tween.onUpdate(function () {
                me.event.publish(me.event.VIEWPORT_ONCHANGE, [
						me.game.viewport.pos
					]);
				});
				tween.start();
			}else if((spy.pos.x + 12) > (me.game.viewport.pos.x + this.cameraWidth)){ //Pan Right
				testx = (Math.floor((spy.pos.x + 12)/this.cameraWidth) * this.cameraWidth);
				tween = new me.Tween(me.game.viewport.pos).to({x:testx}, 600);
				tween.easing(me.Tween.Easing.Quartic.Out);
				tween.onUpdate(function () {
                me.event.publish(me.event.VIEWPORT_ONCHANGE, [
						me.game.viewport.pos
					]);
				});
				tween.start();
			}else if((spy.pos.y + 12) < (me.game.viewport.pos.y )){ //Pan Up
				console.log('pan up ' + me.game.viewport.pos.y);
				if(me.game.viewport.pos.y != 0){
					testy = (Math.floor((spy.pos.y + 12)/this.cameraHeight) * this.cameraHeight);
					tween = new me.Tween(me.game.viewport.pos).to({y:testy}, 600).onUpdate(function () {
					me.event.publish(me.event.VIEWPORT_ONCHANGE, [
							me.game.viewport.pos
						]);
					});
					tween.easing(me.Tween.Easing.Quartic.Out);
					
					tween.start();
				}
				//console.log(spy.pos.y, me.game.viewport.pos.y, this.cameraHeight);
			}else if((spy.pos.y + 12) > (me.game.viewport.pos.y + this.cameraHeight)){ //Pan Down
				this.transitioning = true;
				console.log('pan down');
				testy = (Math.floor((spy.pos.y + 12)/this.cameraHeight) * this.cameraHeight);
				
				
				tween = new me.Tween(me.game.viewport.pos)
					.to({ "y" : testy} , 600)
					.easing(me.Tween.Easing.Quartic.Out)
					.onUpdate(function () {
						//console.log('Viewport pos y 1:' + me.game.viewport.pos.y);
						me.event.publish(me.event.VIEWPORT_ONCHANGE, [
							me.game.viewport.pos
						]);
						//console.log('Viewport pos y 2:' + me.game.viewport.pos.y);
					})
					.onComplete(function () {
					this.transitioning = false;
					}.bind(this));
			
				tween.start();
				//console.log(spy.pos.y, me.game.viewport.pos.y, this.cameraHeight);
			}
			
			//console.log(spy.pos.x + spy.pos.y + me.game.viewport.pos.x);
		}else{
			return false;
		}
		
		
	}
});

/* ---------------------
Traps!

3 Entities: Trigger, Device, and Projectile

When the player steps on the trigger, the trigger finds devices with the same name. 

The devices create a projectile entity and shoots it in a specified direction.

The trigger will have a slight cool down time (red state) before becoming reactivated (green).

----------------------*/
var TrapTriggerEntity = me.ObjectEntity.extend({
	init: function(x,y,settings){
		this.parent(x,y,settings);
		this.collidable = true;
		this.gravity = (0);
		this.updateColRect(2,28,-4,4);
		
		this.renderable.addAnimation('neutral', [0]);
		this.renderable.addAnimation('triggered', [1]);
		this.renderable.setCurrentAnimation('neutral');
		
		this.deviceName = settings.trapName;
		
		this.isTriggered = false;
		this.coolDownTime = 60;
		this.coolDownCounter = 0;
		
	},
	update: function(){
		if(this.isTriggered){
			if(this.coolDownCounter < this.coolDownTime){
				this.coolDownCounter += 1 * me.timer.tick;
			}else{
				this.coolDownCounter = 0;
				this.isTriggered = false;
				this.renderable.setCurrentAnimation('neutral');
			}
		}else{
			//Check for spy collision, find related devices, trigger the devices
			if(spy.alive){
				var res = me.game.collide(this);
				if(res && (res.obj.type == me.game.SPY)){
					this.isTriggered = true;
					this.renderable.setCurrentAnimation('triggered');
					
					var trapDevices = me.game.getEntityByProp('trapName',this.deviceName);
					for(var i = 0; i < trapDevices.length; i++){
						//console.log(trapDevices[i]);
						trapDevices[i].shoot();							
					}	
				}
			}
		}
		this.parent(this);
		return true;
	}
});

var TrapDeviceEntity = me.ObjectEntity.extend({
	init: function(x,y,settings){
		this.parent(x,y,settings);
		this.direction = settings.direction;		
		this.trapName = settings.trapName;
		this.gravity = (0);
		//Do animations for:
		//if this direction left
		//if this direction right
		//if this direction down
		
		//TODO: Animations for Activated state
		if(this.direction == 'right'){
			this.renderable.addAnimation('neutral', [0]);
			this.renderable.addAnimation('triggered', [1]);
			this.particleX = x + 8;
			this.particleY = y;

		}else if(this.direction == 'left'){
			this.renderable.addAnimation('neutral', [4]);
			this.renderable.addAnimation('triggered', [5]);
			this.particleX = x - 8;
			this.particleY = y;

		}else if(this.direction == 'down'){
			this.renderable.addAnimation('neutral', [2]);
			this.renderable.addAnimation('triggered', [3]);
			this.particleX = x;
			this.particleY = y + 8;
		}
		
		this.renderable.setCurrentAnimation('neutral');
		
		this.isTriggered = false;
		this.triggerTime = 20;
		this.triggerCounter = 0;
		
		this.trapX = x;
		this.trapY = y;
	},
	update: function(){
		if(this.triggerCounter < this.triggerTime){
			this.triggerCounter += 1 * me.timer.tick;
		}else{
			this.triggerCounter = 0;
			this.isTriggered = false;
			this.renderable.setCurrentAnimation('neutral');
		}
		
		this.parent(this);
		return true;
	},
	shoot: function(){
		//if this direction left
		//if this direction right
		//if this direction down
		this.isTriggered = true;
		this.renderable.setCurrentAnimation('triggered');
		
		var jumpdust = new JumpDustEntity(this.particleX, this.particleY, {image:'trapparticle', spritewidth:16, spriteheight: 16 });
			me.game.add(jumpdust,this.z + 1);
			me.game.sort();
			
		
		var trapProjectile = new TrapProjectileEntity(this.trapX, this.trapY, {image:'dart', spritewidth:16, spriteheight: 16, direction: this.direction });
			me.game.add(trapProjectile,this.z);
			me.game.sort();
		//console.log(this.pos.x);
		//create projectile object
		//make a sound
		//TODO: Create puff of smoke object

	}
});

var TrapProjectileEntity = me.ObjectEntity.extend({
	init: function(x,y,settings){
		this.parent(x,y,settings);
		this.direction = settings.direction;
		this.alwaysUpdate = true;
		this.gravity = (0);
		this.collision = false;
		this.updateColRect(6,4,6,4);
		this.speed = 5;
		//TODO: Animations for each direction
		
		this.renderable.addAnimation('side',[0]);
		this.renderable.addAnimation('down',[1]);
		
		if(this.direction == 'right'){
			this.renderable.setCurrentAnimation('side');
		}else if(this.direction == 'left'){
			this.renderable.setCurrentAnimation('side');
			this.flipX(true);			
		}else if(this.direction == 'down'){
			this.renderable.setCurrentAnimation('down');
		}
		
		
	},
	update: function(){
		if(this.direction == 'left'){
			//left
			//console.log(this.gravity);
			this.pos.x -= this.speed * me.timer.tick;
			//this.pos.y = 
			//console.log(this.pos.y);
		}else if(this.direction == 'right'){
			//right
			this.pos.x += this.speed * me.timer.tick;
		}else{
			//down
			this.pos.y += this.speed * me.timer.tick;
		}
		
		
		var res = me.game.collide(this);
		
		if(res && res.obj.type == me.game.SPY && spy.alive){
			console.log('caught');
			this.speed = 0;
			if(this.direction == 'right'){
				direction = 'left';
			}else{
				direction = 'right';
			}
			
			spy.caughtKnockedDown(direction);
			me.game.remove(this);
		}
		
		if(!this.inViewport){
			me.game.remove(this);
		}
		
		this.parent(this);
		return true;
	}
});


/* ---------------------
Trap Door

When Spy steps on this platform, the trap is trigger and the door opens
Spy has a split second to jump off

----------------------*/
var TrapDoorEntity = me.ObjectEntity.extend({
	init: function(x,y,settings){
		this.parent(x,y,settings);
		this.collidable = true;
		this.gravity = (0);
		this.type = 'TRAPDOOR';
		//this.updateColRect(2,28,-4,4);
		this.updateColRect(2,28,-4,8);
		
		this.renderable.addAnimation('neutral', [0]);
		this.renderable.addAnimation('triggered', [1,2,1,2]);
		this.renderable.addAnimation('opened', [2]);
		this.renderable.addAnimation('closing', [1,0]);
		this.renderable.setCurrentAnimation('neutral');
		
		this.isTriggered = false;
		this.isOpened = false;
		this.coolDownTime = 120;
		this.coolDownCounter = 0;
		
		this.delayTime = 15;
		this.delayTimeCounter = 0;
		
	},
	update: function(){
		if(this.isOpened){
			//small amount of time before it opens
			if(this.coolDownCounter < this.coolDownTime){
				this.coolDownCounter += 1 * me.timer.tick;
			}else{
				this.coolDownCounter = 0;
				this.isOpened = false;
				this.renderable.setCurrentAnimation('closing','neutral');
			}
			
		}else if(this.isTriggered){
			//small amount of time before it opens
			if(this.delayTimeCounter < this.delayTime){
				this.delayTimeCounter += 1 * me.timer.tick;
			}else{
				this.delayTimeCounter = 0;
				this.isTriggered = false;
				this.isOpened = true;
				this.renderable.setCurrentAnimation('triggered','opened');
			}
			
		}else{
			//Check for spy collision, find related devices, trigger the devices
			
			if(spy.alive){
				var res = me.game.collide(this);
				if(res && (res.obj.type == me.game.SPY) && !res.obj.jumping){
					this.isTriggered = true;			
				}
			}
			
		}
		this.parent(this);
		return true;
	}
});


/* ---------------------
a sawblade entity
----------------------*/
var SawBladeEntity = enemyEntity.extend({
	init: function(x,y,settings){
	this.parent(x,y,settings);
	this.collidable = true;
	this.anchorPoint.set(0,0);
	this.gravity = 0;
		
		//2x speed of spy
		this.speed = (settings.speed) ? settings.speed : 4;
		
		
		//check if vertical or horizontal
		//probably won't use velocity
		if(settings.move == 'y'){
			//Set it up to move back and forth
			this.startY = y;
			this.endY = settings.height - y + 16;		
		
			this.move = 'y';
			this.updateColRect(2,12,2,12);
			
			//move left is up
			if(settings.startSide == 'top'){
				this.pos.y = this.startY;
				this.moveUp = false;
			
			}else{
				this.pos.y = this.endY;		
				console.log(settings.height);
				this.moveUp = true;
			}
			
			
		}else{ //Horizontal/X
			//Set it up to move back and forth
			this.startX = x;
			this.endX = x + settings.width - settings.spritewidth;	
		
			this.move = 'x';
			this.updateColRect(2,12,2,12);
			
				
			if(settings.startSide == 'left'){
				this.pos.x = this.startX;
				this.moveLeft = false;
			
			}else{
				this.pos.x = x + settings.width - settings.spritewidth;
				this.moveLeft = true;
			}
	
		}
		
		
		//Check for and set a startDelay (in frames)
		this.startDelay = (settings.startDelay) ? settings.startDelay : 0;		
		this.startDelayCounter = 0;
		
		this.delayTime = 30;
		this.delayCounter = 0;
		this.hidden = true;
		this.renderable.alpha = 0;
		
		//Need a delay at the beggining and in (in which the animations play)
		this.animDelay = 30;		
		this.startDelayCounter = 0;
		
		this.endDelay = 30;		
		this.endDelayCounter = 0;
		
		this.startPosX = this.pos.x;
		this.startPosY = this.pos.y;
		
		this.renderable.addAnimation('extend', [6,5,4,3,2,1,0],4);
		this.renderable.addAnimation('retract', [0,1,2,3,4,5,6],4);
		this.renderable.addAnimation('spin', [0,1],4);
		
		this.retract = false;
		this.extend = false;
		this.hidden = true;
		//this.renderable.alpha = 0;
		this.renderable.setCurrentAnimation('extend','spin');
		
	},
	update:function(){
		if(this.resetCheck(this.startPosX,this.startPosY)) return false;
		
		//Start Delay
		if(this.startDelay && !this.extend && !this.retract){
			this.startDelayCounter += me.timer.tick;
			if(this.startDelayCounter < this.startDelay){
				this.parent(this);
				return true;
			}else{
				this.startDelay = false;
				this.extend = true;
			}
		}
		
		
		//TODO: Build in a little delay at the start and end
		//This is where the animation will play out
		
		//move horizontal/x
		if(this.move == 'x'){
		
			if (this.moveLeft && this.pos.x <= this.startX) {
				this.retract = true;
			} else if (!this.moveLeft && this.pos.x >= this.endX) {				
				this.retract = true;
			}
			if(!this.retract && !this.extend && !this.hidden){
				this.vel.x = (this.moveLeft) ? -this.speed * me.timer.tick : this.speed * me.timer.tick;
			}else{
				this.vel.x = 0;
			}
		}else if(this.move == 'y'){ //move vertical/y
			if (this.moveUp && this.pos.y <= this.startY) {
				this.retract = true;
			} else if (!this.moveUp && this.pos.y >= this.endY) {
				this.retract = true;				
			}
			
			if(!this.retract && !this.extend  && !this.hidden){
				this.vel.y = (this.moveUp) ? -this.speed * me.timer.tick : this.speed * me.timer.tick;
			}else{
				this.vel.y = 0;
			}
		}
		
		
		if(this.hidden && this.delayCounter <= this.delayTime && !this.retract && !this.extend){
			this.delayCounter += 1 * me.timer.tick;
			this.renderable.alpha = 0;
		}else{
			if(this.hidden && this.delayCounter >= this.delayTime){
				this.extend = true;
			}
			this.hidden = false;
			
			this.renderable.alpha = 1;
			this.delayCounter = 0;
		}
		
		if(this.extend){
			this.renderable.setCurrentAnimation('extend',function() {this.extendBlade()}.bind(this));
		}
		if(this.retract){
			this.renderable.setCurrentAnimation('retract',function() {this.retractBlade()}.bind(this));
		}
		
		var currentFrame = this.renderable.getCurrentAnimationFrame();
		//Change collision box based on animation frame
		if(currentFrame != 1 && currentFrame != 0){
			//console.log(currentFrame);
			if(this.move == 'y'){
				if(this.renderable.isCurrentAnimation('retract')){
					switch (currentFrame){
						case 2:
							this.updateColRect(2,11,2,12);
							break;
						case 3:
							this.updateColRect(2,8,2,12);
							break;
						case 4:
							this.updateColRect(2,5,2,12);
							break;
						case 5:
							this.updateColRect(2,2,2,12);
							break;
						case 6:
							this.updateColRect(0,0,2,12);
							break;
					}
				}else if(this.renderable.isCurrentAnimation('extend')){
					switch (currentFrame){
						case 2:
							this.updateColRect(0,0,2,12);
							break;
						case 3:
							this.updateColRect(2,2,2,12);
							break;
						case 4:
							this.updateColRect(2,5,2,12);
							break;
						case 5:
							this.updateColRect(2,8,2,12);
							break;
						case 6:							
							this.updateColRect(2,11,2,12);
							break;
					}
				}
			}
		}else{
			if(this.move == 'y'){
				this.updateColRect(2,12,2,12);
			}
		}
		
		this.updateMovement();
		if(!this.hidden && currentFrame != 1 && currentFrame != 0){
			var res = me.game.collide(this);
			
			if(res && res.obj.type == me.game.SPY && spy.alive){
				console.log('caught');
				//spy.caught();
				spy.caughtKnockedDown('down');
			}
		}
		this.parent(this);
		return true;
		
	},
	retractBlade:function(){
		this.renderable.setCurrentAnimation('spin');
		if(this.move == 'x'){ this.pos.x = this.startPosX; }
		else { this.pos.y = this.startPosY; }
		this.hidden = true;
		this.retract = false;
		this.renderable.alpha = 0;
	},
	extendBlade:function(){
		this.renderable.setCurrentAnimation('spin');
		this.extend = false;
	}
});


/* ---------------------
a one-way door entity
----------------------*/
var OneWaySwitchEntity = me.ObjectEntity.extend({
	init: function(x,y,settings){
		this.parent(x,y,settings);
		this.doorName = settings.doorName;
		this.activated = false;
		this.renderable.addAnimation('unactivated', [0]);
		this.renderable.addAnimation('activated', [1]);
		this.renderable.setCurrentAnimation('unactivated');
	},
	update: function(){	
		if(!this.activated){
			//if spy collides, start hack
			if(spy.alive){
				var res = me.game.collide(this);
				if(res && (res.obj.type == me.game.SPY)){
					this.activated = true;
					this.renderable.setCurrentAnimation('activated');
					me.audio.play("text");
					var door = me.game.getEntityByProp('doorName',this.doorName);
					for(var i = 0; i < door.length; i++){
						door[i].hacked = true;			
					}						
				}
			}
		}
		this.parent(this);
		return true;
	}
});


/* ---------------------
a hackable computer entity
----------------------*/
var HackableComputerEntity = me.ObjectEntity.extend({
	init: function(x,y,settings){
		this.parent(x,y,settings);		
		this.doorName = settings.doorName;
		
		this.hackTime = (settings.hackTime) ? settings.hackTime : 60;
				
		this.hackCounter = 0;
		this.hacked = false;
		//hack		
		//TODO: Base this off of hacktime
		this.renderable.addAnimation('computer', [0]);
		this.renderable.setCurrentAnimation('computer');
	},
	update: function(){
		if(!this.hacked){
			//if spy collides, start hack
			if(spy.alive){
				var res = me.game.collide(this);
				if(res && (res.obj.type == me.game.SPY)){
					if(this.hackCounter <= this.hackTime){
						this.hackCounter += 1 * me.timer.tick;
					}else{
						//find the associated door and open it
						var door = me.game.getEntityByProp('doorName',this.doorName);
						for(var i = 0; i < door.length; i++){
							door[i].hacked = true;							
						}
						//this.hacked = true;
						me.audio.play("text");
					}					
				}else{
					//reset counter
					this.hackCounter = 0;
				}
			}
		}
		this.parent(this);
		return true;
	}
});

/* ---------------------
a hackable door entity
----------------------*/
var HackableDoorEntity = me.ObjectEntity.extend({
	init: function(x,y,settings){
		this.parent(x,y,settings);
		this.collidable = true;
		this.updateColRect(4,8,-1,0);
		this.doorName = settings.doorName;
		this.hacked = false;
		this.opening = false;
		//
		this.renderable.addAnimation('locked', [0]);
		this.renderable.addAnimation('opening', [1,2]);
		this.renderable.addAnimation('opened', [2]);
		this.renderable.setCurrentAnimation('locked');
		
		this.leftX = this.collisionBox.left;
		this.rightX = this.collisionBox.right;
		console.log(this.rightX);
		console.log(this.leftX);
	},
	update: function(){
		//if colliding and not hacked, set spy vel.x = 0
		if(!this.hacked){
			var res = me.game.collide(this);
			if(res && (res.obj.type == me.game.SPY)){				
				//compare spy's direction and the side being collided against
				if((spy.collisionBox.left > this.leftX && !spy.currentDirection) || (spy.collisionBox.right < this.rightX && spy.currentDirection)){		
					spy.stopX = true;	
				}else{
					spy.stopX = false;
				}
				
			}else{				
				spy.stopX = false;
			}
		}else{
			//else, open on up and do nothing
			if(!this.opening){
				this.renderable.setCurrentAnimation('opening','opened');
				this.opening = true;
			}
		}
		this.parent(this);
		return true;
	}
});

/* ---------------------
Mission 1 Cutscene
This is probably bad but whatever.
----------------------*/

var MissionBuildingEntity = me.ObjectEntity.extend({
	init:function(x,y,settings){
		this.parent(x,y,settings);
		this.jitter = false;
		this.jitterUp = false;
		this.jitterCounter = 30;
		
		if(me.audio.getCurrentTrack()) me.audio.stop(me.audio.getCurrentTrack());
		
		var bgm = new AudioControllerEntity(0, 0, {newTrack:'2', fadeTo:.5, fadeStep:0.0025});
					me.game.add(bgm,100);
					me.game.sort();
		//
		me.game.viewport.fadeOut('#000000',300);
		//Transition
		leveltransition = new LevelTransitionEntity(-160, -120, {image:'spiraltransition3', spritewidth:640, spriteheight: 480, transitionType: 'in' });
		me.game.add(leveltransition,60);
		me.game.sort();
		
		console.log(this.pos.y);
		
		tweenP1 = new me.Tween(this.pos).to({y:-368}, 300);
		tweenP1.easing(me.Tween.Easing.Quintic.InOut);
		
		tweenP2 = new me.Tween(this.pos).to({y:-358}, 3000);
		tweenP2.easing(me.Tween.Easing.Quintic.InOut);
		
		tweenP3 = new me.Tween(this.pos).to({y:-368}, 3000);
		tweenP3.easing(me.Tween.Easing.Quintic.InOut);
		
		
		tween1 = new me.Tween(this.pos).to({x:-32}, 600);
		tween1.easing(me.Tween.Easing.Quartic.Out);
		
		tween2 = new me.Tween(this.pos).to({x:32}, 600);
		tween2.easing(me.Tween.Easing.Quartic.Out);
		
		tween3 = new me.Tween(this.pos).to({y:32,x:16}, 1200);
		tween3.easing(me.Tween.Easing.Quartic.Out);
		
		tween4 = new me.Tween(this.pos).to({y:24}, 3000);
		tween4.easing(me.Tween.Easing.Quintic.InOut);
		
		tween5 = new me.Tween(this.pos).to({y:32}, 3000);
		tween5.easing(me.Tween.Easing.Quintic.InOut);
		
		//need to create controls object that skips title here
		//Should it start mission 1 automatically or wait for input?
		
		tweenP1.chain(tween1);
		
		tween1.chain(tween2);
		tween2.chain(tween3);
		tween3.chain(tween4).onComplete(function() {this.drawMissionText();}.bind(this));
		tween4.chain(tween5);
		tween5.chain(tween4);
		tweenP1.start();
		
	},
	update:function(){
		if(me.input.isKeyPressed('nextLevel') || me.input.isKeyPressed('jump')){ 
			//me.game.viewport.fadeIn('#000000',1000,function(){ me.levelDirector.loadLevel('m_01_lvl_01'); });
			
			leveltransition = new LevelTransitionEntity(-160, -120, {image:'spiraltransition3', spritewidth:640, spriteheight: 480, transitionType: 'out' });
					me.game.add(leveltransition,120);
					me.game.sort();
					
				me.game.viewport.fadeIn('#000000',500, function(){ me.levelDirector.loadLevel('m_01_lvl_01'); });
		}
		this.parent(this);
		return true;	
	},
	drawMissionText:function(){
		//Create Mission Title Object using 'mission_01_title'
		missionTitle = new MissionTitleEntity(40, 40, {image:'mission_01_title', spritewidth:140, msg: 'INFILTRATE GALE-ELECTRO TOWER' });
			me.game.add(missionTitle,this.z + 2);
			me.game.sort();
		//draw text to screen
			//INFILTRATE GALE-ELECTRO TOWER
	}
});


/* ---------------------
a Mission Title entity
----------------------*/

var MissionTitleEntity = me.ObjectEntity.extend({
	init: function(x,y,settings){
		this.parent(x,y,settings);
		this.alwaysUpdate = true;
		this.msg = settings.msg;
		
		/*
		tween1 = new me.Tween(this.pos).to({x:40}, 600);
		tween1.easing(me.Tween.Easing.Quartic.Out);
		me.audio.play("title");
		tween1.start().onComplete(function() {this.drawMissionText();}.bind(this));
		*/
		
		
		this.renderable.addAnimation('defaultAnim', null, 1);
		this.renderable.addAnimation('defaultAnimStop', [9], 1);
		this.renderable.setCurrentAnimation('defaultAnim',function(){this.drawMissionText();}.bind(this));
		me.audio.play('title_cloak');
	},
	update: function(){
		this.parent(this);
		return true;
	},
	drawMissionText:function(){
		this.renderable.setCurrentAnimation('defaultAnimStop');
		//Create Mission Title Object using 'mission_01_title'
		missionTitle = new MissionSubTitleEntity(0, 0, { msg: this.msg });
			me.game.add(missionTitle,this.z + 2);
			me.game.sort();
		//draw text to screen
			//INFILTRATE GALE-ELECTRO TOWER
	}
});

/* ---------------------
a Mission Sub-Title entity
----------------------*/

var MissionSubTitleEntity = me.ObjectEntity.extend({
	init: function(x,y,settings){
		settings.height = 240;
		settings.width = 320;
		this.alwaysUpdate = true;
		this.parent(x,y,settings);
		//Load the font
		this.font = new me.BitmapFont('8x8PressStartP2',8);
		this.msg = settings.msg;
		this.msgSplit = this.msg.split('');
		this.msgIndex = 0;
		//console.log(this.msgSplit);
		this.msg = '';
		this.timer = 0;
		this.timer2 = 0;
		this.msgComplete = false;
	},
	update:function(){
		this.timer++;
		if(this.timer > 4){
			if(this.msgIndex < this.msgSplit.length){
				this.msg += this.msgSplit[this.msgIndex];
				this.msgIndex++;
				me.audio.play("text");
			}else{
				this.msgComplete = true;
			}
			this.timer = 0;
		}
		
		if(this.msgComplete) this.timer2++;
		
		if(this.timer2 > 120){
			this.timer2 = 0;
			this.msgComplete = false;
			//me.game.viewport.fadeIn('#000000',1000,function(){ me.levelDirector.loadLevel('m_01_lvl_01'); });
			//me.levelDirector.loadLevel('m_01_lvl_01');
			
			leveltransition = new LevelTransitionEntity(-160, -120, {image:'spiraltransition3', spritewidth:640, spriteheight: 480, transitionType: 'out' });
					me.game.add(leveltransition,120);
					me.game.sort();
					
				me.game.viewport.fadeIn('#000000',500, function(){ me.levelDirector.loadLevel('m_01_lvl_01'); });
		}
		
	},
	draw: function(context){
		this.msgWidth = this.font.measureText(context,this.msg).width;
		this.font.draw(context,
			this.msg,40,
			200);
	}
});

/* ---------------------
Controls Handler
----------------------*/
var ControlHandlerEntity = me.ObjectEntity.extend({
	init:function(x,y){
		settings = {};
        settings.width = 0;
        settings.height = 0;		
		this.parent(x,y,settings);
		this.alwaysUpdate = true;
		this.nextLevel = me.game.getEntityByName("exitdoor")[0].nextLevel;
		this.mission = this.nextLevel.split("_")[01];
	},
	update:function(){
		//might as well keep track of time here
		me.gamestat.updateValue("timeToBeat", me.timer.tick);
	
		//Retry
		if(me.input.isKeyPressed('retry')){
			//me.game.HUD.reset("EnergyGauge");
			me.levelDirector.reloadLevel();
		}
		
		//Level Skip
		if(me.input.isKeyPressed('nextLevel')){ 
			me.levelDirector.loadLevel(this.nextLevel);
			//me.game.HUD.setItemValue('LevelName',this.nextLevel);
		}
		//Mission
				
		//Primative Level Select
		if(me.input.isKeyPressed('lvl_01')){ //01
			me.levelDirector.loadLevel('m_' + this.mission + '_lvl_01');
			//me.game.HUD.setItemValue('LevelName','m_' + this.mission + '_lvl_01');
		}
		if(me.input.isKeyPressed('lvl_02')){ //02
			//me.game.HUD.setItemValue('LevelName','m_' + this.mission + '_lvl_02');
			me.levelDirector.loadLevel('m_' + this.mission + '_lvl_02');
		}
		if(me.input.isKeyPressed('lvl_03')){ //03
			me.levelDirector.loadLevel('m_' + this.mission + '_lvl_03');
			//me.game.HUD.setItemValue('LevelName','m_' + this.mission + '_lvl_03');
		}
		if(me.input.isKeyPressed('lvl_04')){ //04
			me.levelDirector.loadLevel('m_' + this.mission + '_lvl_04');
			//me.game.HUD.setItemValue('LevelName','m_' + this.mission + '_lvl_04');
		}
		if(me.input.isKeyPressed('lvl_05')){ //05
			me.levelDirector.loadLevel('m_' + this.mission + '_lvl_05');
			//me.game.HUD.setItemValue('LevelName','m_' + this.mission + '_lvl_05');
		}
		if(me.input.isKeyPressed('lvl_06')){ //06
			me.levelDirector.loadLevel('m_' + this.mission + '_lvl_06');
			//me.game.HUD.setItemValue('LevelName','m_' + this.mission + '_lvl_06');
		}
		if(me.input.isKeyPressed('lvl_07')){ //07
			me.levelDirector.loadLevel('m_' + this.mission + '_lvl_07');
			//me.game.HUD.setItemValue('LevelName','m_' + this.mission + '_lvl_07');
		}
		if(me.input.isKeyPressed('lvl_08')){ //08
			me.levelDirector.loadLevel('m_' + this.mission + '_lvl_08');
			//me.game.HUD.setItemValue('LevelName','m_' + this.mission + '_lvl_08');
		}
		if(me.input.isKeyPressed('lvl_09')){ //09
			me.levelDirector.loadLevel('m_' + this.mission + '_lvl_09');
			//me.game.HUD.setItemValue('LevelName','m_' + this.mission + '_lvl_09');
		}
		if(me.input.isKeyPressed('lvl_10')){ //10
			me.levelDirector.loadLevel('m_' + this.mission + '_lvl_10');
			//me.game.HUD.setItemValue('LevelName','m_' + this.mission + '_lvl_10');
		}
		
		//Toggle Music
		
		//Toggle Sound
	}
});