/*------------------- 
a player entity
-------------------------------- */
var player = undefined;
var interval = false;
game.PlayerEntity = me.Entity.extend({
 
  /* -----
 
  constructor
 
  ------ */
  
  init: function(x, y, settings) {
    // call the constructor
    this._super(me.Entity, 'init', [x, y, settings]);
    // set the default horizontal & vertical speed (accel vector)
    this.body.setVelocity(5, 15);
    this.blendInMode = false;
    this.hasClothes = false;
    this.hasSword = false;
    this.type = 'player';
    this.walkLeft = false;
    this.hasKey = false;
    this.mode = false;
    this.killed = 0;
    this.showVision = false;
    // set the display to follow our position on both axis
    me.game.viewport.follow(this.pos, me.game.viewport.AXIS.BOTH);
    this.body.setCollisionMask(me.collision.types.WORLD_SHAPE | me.collision.types.COLLECTABLE_OBJECT | me.collision.types.ENEMY_OBJECT);
    // ensure the player is updated even when outside of the viewport
    this.alwaysUpdate = true;
  
    this.renderable.addAnimation("walk",  [0, 1, 0, 2]);
    this.renderable.addAnimation("swordWalk",  [3, 4, 3, 5]);
    this.renderable.addAnimation("blendInWalk",  [12, 13]);
    this.renderable.addAnimation("attack",  [6, 7, 8], 250);
    this.renderable.addAnimation("die",  [9, 10, 11], 225);
    this.renderable.addAnimation("stayDead", [11, 11 , 11], 500);
    this.renderable.addAnimation("stand",  [0]);
    this.renderable.addAnimation("swordStand",  [3]);
    this.renderable.addAnimation("blendInStand",  [12]);
    this.renderable.addAnimation("giveUp", [14, 15, 16], 200);
    this.renderable.addAnimation("stayGiveUp", [16, 16, 16], 500);
    this.renderable.addAnimation("changeToStealth", [17, 18, 19, 20, 21]);
    this.renderable.addAnimation("changeToNormal", [22, 23, 24, 25, 26]);
 
    if(this.mode == false) {
      this.renderable.setCurrentAnimation("stand");
    } else {
      this.renderable.setCurrentAnimation("swordStand");
    }
  },
 
  /* -----
 
  update the player pos

  ------ */
  update: function(dt) {
    if(this.alive && !this.renderable.isCurrentAnimation("attack") && !this.renderable.isCurrentAnimation("changeToStealth") && !this.renderable.isCurrentAnimation("changeToNormal")){
      if (me.input.isKeyPressed('left')) {
        // flip the sprite on horizontal axis
        this.walkLeft = true;
        this.renderable.flipX(this.walkLeft);
        // update the entity velocity
        this.body.vel.x -= this.body.accel.x * me.timer.tick;
        // change to the walking animation
        if(this.blendInMode){
          if (!this.renderable.isCurrentAnimation("blendInWalk")) {
            this.renderable.setCurrentAnimation("blendInWalk");
          }
        }
        else if (this.mode == false) {
          if (!this.renderable.isCurrentAnimation("walk")) {
            this.renderable.setCurrentAnimation("walk");
          }
        } else{
            if (!this.renderable.isCurrentAnimation("swordWalk")) {
              this.renderable.setCurrentAnimation("swordWalk");
            }
          }
      } else if (me.input.isKeyPressed('right')) {
        // unflip the sprite
        this.walkLeft = false;
        this.renderable.flipX(this.walkLeft);
        // update the entity velocity
        this.body.vel.x += this.body.accel.x * me.timer.tick;
        // change to the walking animation
        // change to the walking animation
        if(this.blendInMode){
          if (!this.renderable.isCurrentAnimation("blendInWalk")) {
            this.renderable.setCurrentAnimation("blendInWalk");
          }
        }
        else if (this.mode == false) {
          if (!this.renderable.isCurrentAnimation("walk")) {
            this.renderable.setCurrentAnimation("walk");
          }
        } else {
            if (!this.renderable.isCurrentAnimation("swordWalk")) {
              this.renderable.setCurrentAnimation("swordWalk");
            }
          }
      } else {
        this.body.vel.x = 0;
        // change to the standing animation
        // change to the walking animation
        if(this.blendInMode){
          if (!this.renderable.isCurrentAnimation("blendInStand")) {
            this.renderable.setCurrentAnimation("blendInStand");
          }
        }
        else if (this.mode == false){
          if (!this.renderable.isCurrentAnimation("stand"))
           this.renderable.setCurrentAnimation("stand");
        } else {
            if (!this.renderable.isCurrentAnimation("swordStand"))
              this.renderable.setCurrentAnimation("swordStand");
        }
      }
      if (me.input.isKeyPressed('V') && !this.showVision){
          this.showVision = true;
          interval = true;
          visionInterval = setTimeout(function(){interval = false,  clearTimeout(visionInterval)}, 2000);
      }
      if(interval === false)
        this.showVision = false;
      
      if (me.input.isKeyPressed('jump')) {
        // make sure we are not already jumping or falling
        if (!this.body.jumping && !this.body.falling) {
          // set current vel to the maximum defined value
          // gravity will then do the rest
          this.body.vel.y = -this.body.maxVel.y * me.timer.tick;
          // set the jumping flag
          this.body.jumping = true;
          // play some audio
          me.audio.play("jump");
        }
      }
      if (me.input.isKeyPressed('X') &&  this.hasClothes && !this.body.falling && !this.body.jumping ){
        if(this.hasKey === false){
          if(this.blendInMode){
            this.body.setCollisionMask(me.collision.types.WORLD_SHAPE | me.collision.types.COLLECTABLE_OBJECT | me.collision.types.ENEMY_OBJECT);
            this.body.setVelocity(5, 15);
            this.blendInMode = false;
            if(this.mode)
              this.renderable.setCurrentAnimation("changeToNormal", "swordStand");
            else
              this.renderable.setCurrentAnimation("changeToNormal", "stand");
          }
          else{
            this.body.setCollisionMask(me.collision.types.WORLD_SHAPE | me.collision.types.COLLECTABLE_OBJECT);
            this.body.setVelocity(3, 9);
            this.blendInMode = true;
            this.renderable.setCurrentAnimation("changeToStealth", "blendInStand");
          }
        }
        else{
          if(this.blendInMode){
            this.body.setCollisionMask(me.collision.types.WORLD_SHAPE | me.collision.types.COLLECTABLE_OBJECT | me.collision.types.ENEMY_OBJECT | me.collision.types.ACTION_OBJECT);
            this.body.setVelocity(5, 15);
            this.blendInMode = false;
            if(this.mode)
              this.renderable.setCurrentAnimation("changeToNormal", "swordStand");
            else
              this.renderable.setCurrentAnimation("changeToNormal", "stand"); 
          }
          else{
            this.body.setCollisionMask(me.collision.types.WORLD_SHAPE | me.collision.types.COLLECTABLE_OBJECT | me.collision.types.ACTION_OBJECT);
            this.body.setVelocity(3, 9);
            this.blendInMode = true;
            this.renderable.setCurrentAnimation("changeToStealth", "blendInStand");
          }
        }
        me.audio.play("clothesChanging");
      } 
   }
    else{
      this.body.vel.x = 0;
    }
    if(!this.alive)
      this.body.setCollisionMask(me.collision.types.WORLD_SHAPE);
    // apply physics to the body (this moves the entity)
    this.body.update(dt);
    player = this;
    // handle collisions against other shapes
    me.collision.check(this);
    // return true if we moved or if the renderable was updated
    return (this._super(me.Entity, 'update', [dt]) || this.body.vel.x !== 0 || this.body.vel.y !== 0);
  },
   
  /**
   * colision handler
   * (called when colliding with other objects)
   */
  onCollision : function (response, other) {
    
    if (response.b.type === 'sword'){
      this.mode = true;
    }
    else if(response.b.type === 'key')
      this.hasKey = true;
    
    return true;
  }
});
/*----------------
  a Food entity
 ----------------- */
game.FoodEntity = me.CollectableEntity.extend({
  // extending the init function is not mandatory
  // unless you need to add some extra initialization
  init: function(x, y, settings) {
    // call the parent constructor
    this.num = settings.foodNum;
    if(game.data.score === 0)
      eatenFood = [];
    this._super(me.CollectableEntity, 'init', [x, y , settings]);
    this.body.setVelocity(0, 0);
   
  },

   update : function(dt){
      
      for(i = 0; i < eatenFood.length; i++){
        if(eatenFood[i] === this.num){
          me.game.world.removeChild(this);
        }
      }
      this.body.update(dt);
      return (this._super(me.Entity, 'update', [dt]));
   },

  // this function is called by the engine, when
  // an object is touched by something (here collected)
  onCollision : function (response, other) {
    // do something when collected
    // play a "eating collected" sound
    if(response.a.type === 'player'){
      
      // give some score
      if(game.data.score < 3){
        me.audio.play("eating");
        game.data.score += 1;
      }
      else 
        me.audio.play("stomp");
      
      if(this.num !== undefined)
        eatenFood.push(this.num);
    // make sure it cannot be collected "again"
      this.body.setCollisionMask(me.collision.types.NO_OBJECT);
   
      // remove it
      me.game.world.removeChild(this);
       
    }
    return false
  }
});
/*----------------
  a Key entity
 ----------------- */
game.keyEntity = me.CollectableEntity.extend({
  // extending the init function is not mandatory
  // unless you need to add some extra initialization
  init: function(x, y, settings) {
    // call the parent constructor
    this._super(me.CollectableEntity, 'init', [x, y , settings]);
    this.type = 'key';
 
  },
 
  // this function is called by the engine, when
  // an object is touched by something (here collected)
  onCollision : function (response, other) {
    // do something when collected
    // play a "eating collected" sound
    if(response.a.type === 'player'){
      me.audio.play("keys");
      player.body.setCollisionMask(me.collision.types.WORLD_SHAPE | me.collision.types.COLLECTABLE_OBJECT | me.collision.types.ENEMY_OBJECT | me.collision.types.ACTION_OBJECT);
      player.body.setVelocity(5, 15);
      player.blendInMode = false;
      // give some score
      // make sure it cannot be collected "again"
      this.body.setCollisionMask(me.collision.types.NO_OBJECT);
   
      // remove it
      me.game.world.removeChild(this);
    }
     
    return false
  }
});

/*----------------
  a stealth clothing entity
 ----------------- */
game.StealthClothes = me.CollectableEntity.extend({
  // extending the init function is not mandatory
  // unless you need to add some extra initialization
  init: function(x, y, settings) {
    // call the parent constructor
    this._super(me.CollectableEntity, 'init', [x, y , settings]);
    this.type = 'stealthClothes';
 
  },
 
  // this function is called by the engine, when
  // an object is touched by something (here collected)
  onCollision : function (response, other) {
    // do something when collected
    // play a "eating collected" sound
    if(response.a.type === 'player'){
      me.audio.play("grabItem");
      player.hasClothes = true;
      this.body.setCollisionMask(me.collision.types.NO_OBJECT);
   
      // remove it
      me.game.world.removeChild(this);
    }
     
    return false
  }
});

/*----------------
  a Instructions entity
 ----------------- */
game.PlayerInstructions = me.Entity.extend({
  // extending the init function is not mandatory
  // unless you need to add some extra initialization
  init: function(x, y, settings) {
    // call the parent constructor
    this._super(me.Entity, 'init', [x, y , settings]);
    this.body.setCollisionMask(me.collision.types.NO_OBJECT);
 
  }
});

/*----------------
  a credits ending entity
 ----------------- */
game.CreditsEnding = me.Entity.extend({
  // extending the init function is not mandatory
  // unless you need to add some extra initialization
  init: function(x, y, settings) {
    // call the parent constructor
    this._super(me.Entity, 'init', [x, y , settings]);
 
  },
  // this function is called by the engine, when
  // an object is touched by something (here collected)
  onCollision : function (response, other) {
    // do something when collected
    // play a "eating collected" sound
    if(response.a.type === 'player'){
      //this.body.setCollisionMask(me.collision.types.NO_OBJECT);
      me.state.change(me.state.CREDITS);
      // remove it
      me.game.world.removeChild(this);
    }
     
    return false
  }
});

/*----------------
  a Sword entity
 ----------------- */
game.sword = me.CollectableEntity.extend({
  // extending the init function is not mandatory
  // unless you need to add some extra initialization
  init: function(x, y, settings) {
    // call the parent constructor
    this._super(me.CollectableEntity, 'init', [x, y , settings]);
    this.type = 'sword';
  },
 
  // this function is called by the engine, when
  // an object is touched by something (here collected)
  onCollision : function (response, other) {
    // do something when collected
    // play a "sword collected" sound
    
    if(response.a.type === 'player'){
      me.audio.play("swordCollection");
      // make sure it cannot be collected "again"
      this.body.setCollisionMask(me.collision.types.NO_OBJECT);
      // remove it
      me.game.world.removeChild(this);
    }
     
    return false
  }
});
/*----------------
  Note entity
------------------------ */
game.NoteEntity = me.CollectableEntity.extend({
  init: function(x,y, settings){
    //settings.image = "note"
    this._super(me.CollectableEntity, 'init', [x, y , settings]);
    this.text = settings.text;
    //this.anchorPoint.set(0.5,0.0);
    //this.updateColRect(0, 96, 0, 96);
        // make it collidable
        this.collidable = true;
    // make it invisible
    this.image = 0.0;
  },
  
  /*onCollision : function(response){
    me.audio.play("stomp");
    game.data.dialog = true;
    game.data.text = this.text;
    this.body.setCollisionMask(me.collision.types.NO_OBJECT);
    me.game.world.removeChild(this);
    return false;
  }*/
  // this function is called by the engine, when
  // an object is touched by something (here collected)
  onCollision : function (response, other) {
    // do something when collected
    // play a "eating collected" sound
    //this.myAlpha = 0;
    if(response.a.type === 'player'){
      me.audio.play("page_turn");
      //this.body.setCollisionMask(me.collision.types.NO_OBJECT);
      // make it invisible
      this.image = 1.0;
      this.collidable = false;

      // remove it
      me.game.world.removeChild(this);
    }
     this.image = 0;
    return false
  }
});
/*----------------
  Spike entity
 ----------------- */
 game.SpikeEntity = me.CollectableEntity.extend(
{    
    init: function (x, y, settings)
    {

        this._super(me.CollectableEntity, 'init', [x, y , settings]);
        this.body.setVelocity(0, 0);
    },

    onCollision : function (response, other) {
      if (player.alive && response.a.type === 'player'){
          player.alive = false;
          game.data.score -= 1;
          if(game.data.score === 0) 
            player.renderable.setCurrentAnimation("die", function(){player.renderable.setCurrentAnimation("stayDead", function(){me.state.change(me.state.GAMEOVER)})});
          else
            player.renderable.setCurrentAnimation("die", function(){player.renderable.setCurrentAnimation("stayDead", function(){me.levelDirector.reloadLevel()})});
          player.body.vel.x = 0;
          player.alive = false;
          me.audio.play("dying");
          me.game.world.removeChild(this);
        return false;
      }
      return true;
    }
});
/*----------------
  Falling entity
 ----------------- */
game.FallEntity = me.CollectableEntity.extend({
  init: function(x,y,settings){
    this._super(me.CollectableEntity,'init',[x,y,settings]);
    this.body.setVelocity(0,0);
  },
  
  onCollision: function(response,other){
    if(player.alive && response.a.type === 'player'){
      player.alive=false;
      game.data.score = 0;
      if(game.data.score === 0){
        player.renderable.setCurrentAnimation("die", function(){player.renderable.setCurrentAnimation("stayDead",function(){me.state.change(me.state.GAMEOVER)})});
      }else
              player.renderable.setCurrentAnimation("die", function(){player.renderable.setCurrentAnimation("stayDead", function(){me.levelDirector.reloadLevel()})});
            
            player.body.vel.x = 0;
            player.alive = false;
            me.game.world.removeChild(this);
            return false;
    }
    return true;
  }
  });
/*----------------
  Enemy entity
 ----------------- */
game.EnemyEntity = me.Entity.extend(
{    
    init: function (x, y, settings)
    {
        this.vision = false;
        this.mVision = undefined;
        this.sightDist = settings.sightDist;
        if(this.sightDist === undefined) this.sightDist = 200 + (100 * Math.round(Math.random()*1));

        // define this here instead of tiled
        settings.image = "wheelie_right";
        this.type = 'enemy';
        // save the area size defined in Tiled
        var width = settings.width;
        var height = settings.height;

        // adjust the size setting information to match the sprite size
        // so that the entity object is created with the right size
        settings.spritewidth = settings.width = 63;
        settings.spriteheight = settings.height = 90;
        
        // call the parent constructor
        this._super(me.Entity, 'init', [x, y , settings]);
        // set start/end position based on the initial area size
        x = this.pos.x;
        this.startX = x;
        this.endX   = x + width - settings.spritewidth;
        this.pos.x  = x + width - settings.spritewidth;

        this.renderable.addAnimation("stand",  [0]);
        this.renderable.addAnimation("walk",  [0, 1, 0, 2]);

        // manually update the entity bounds as we manually change the position
        this.updateBounds();

        // to remember which side we were walking
        this.walkLeft = false;

        // walking & jumping speed
        this.body.setVelocity(3, 6);
    },
        
    // manage the enemy movement
    update : function (dt)
    {            
        if (this.alive)
        {
            //if (me.input.isKeyPressed('V') && player.alive){
            if(player !== undefined && player.showVision){
              if(!this.vision && this.sightDist !== 0){
                this.makeVision();
              }
            }
            if(player !== undefined && !player.showVision){
              if(this.vision){
                me.game.world.removeChild(this.mVision);
                this.vision = false;
              }
            }
              
            // if(this.vision && this.vEntity !== undefined){
            //   this.vision = false;
            //   //console.log("asdf");
            // }

            if (this.walkLeft && this.pos.x <= this.startX)
            {
                this.walkLeft = false;
            }
            else if (!this.walkLeft && this.pos.x >= this.endX)
            {
                this.walkLeft = true;
            }
            
            this.renderable.flipX(this.walkLeft);
            this.body.vel.x += (this.walkLeft) ? -this.body.accel.x * me.timer.tick : this.body.accel.x * me.timer.tick;
            
            if(player != undefined && player.renderable){
              if((!player.blendInMode || player.renderable.isCurrentAnimation("changeToStealth")) && (Math.abs((player.pos.y + 85) - (this.pos.y + 90)) < 40)){
                if(((player.pos.x < this.pos.x && this.walkLeft) || (player.pos.x > this.pos.x && this.walkLeft === false)) && Math.abs(player.pos.x - this.pos.x) < this.sightDist){
                  this.getCaught();
                }
              }
            }

        }
        else
        {
            this.body.vel.x = 0;
        }
        // check & update movement
        this.body.update(dt);
        
        // handle collisions against other shapes
        me.collision.check(this);
            
        // return true if we moved or if the renderable was updated
        return (this._super(me.Entity, 'update', [dt]) || this.body.vel.x !== 0 || this.body.vel.y !== 0);
    },
  
    /**
     * colision handler
     * (called when colliding with other objects)
     */
    onCollision : function (response, other) {

      if (response.b.body.collisionType !== me.collision.types.WORLD_SHAPE){
        if (this.alive && response.b.body.collisionType !== me.collision.types.COLLECTABLE_OBJECT && other.type === 'player'){
          if (this.alive && player.alive && player.mode){
            if (response.overlapV.y > 0){
            this.alive = false;
              this.body.setCollisionMask(me.collision.types.NO_OBJECT);
              me.game.world.removeChild(this);
              player.renderable.setCurrentAnimation("attack", "swordStand");
              me.audio.play("SwordSwing");
              player.killed++;
              if(this.vision) me.game.world.removeChild(this.mVision);
              return false;
            }
            else if(player.renderable.isCurrentAnimation("changeToNormal"))
              return false;
            else if((player.walkLeft === this.walkLeft) && ((this.walkLeft && this.pos.x < player.pos.x) || (!this.walkLeft && this.pos.x > player.pos.x))){
              this.alive = false;
              this.body.setCollisionMask(me.collision.types.NO_OBJECT);
              me.game.world.removeChild(this);
              player.renderable.setCurrentAnimation("attack", "swordStand");
              me.audio.play("SwordSwing");
              player.killed++;
              if(this.vision) me.game.world.removeChild(this.mVision);
              return false;
            }
          }
          this.getCaught();
        }
        return false;
      }
      // Make all other objects solid
      return true;
    },

    makeVision: function(){

      this.vision = true;
      this.mVision = new game.visionEntity(this, {image:'visionSprite', spritewidth: this.sightDist, width: this.sightDist*2, height: 77});
      me.game.world.addChild(this.mVision);
      return;
    },

    getCaught : function(){
      if(player.alive){
        this.renderable.setCurrentAnimation("stand"); 
        this.alive = false;
        game.data.score -= 1;
        if(game.data.score === 0)
          player.renderable.setCurrentAnimation("giveUp", function(){player.renderable.setCurrentAnimation("stayGiveUp", function(){me.state.change(me.state.GAMEOVER)})});
        else
          player.renderable.setCurrentAnimation("giveUp", function(){player.renderable.setCurrentAnimation("stayGiveUp", function(){me.levelDirector.reloadLevel()})});
        player.body.vel.x = 0;
        player.alive = false;
        me.audio.play("shotgunReload");
      }
    }
});
//----------------
// Vision Entity
//----------------
game.visionEntity = me.Entity.extend({
  init: function(enemy, settings){
    this.enemy = enemy;
    if(this.enemy.walkLeft)
      this.xPos = this.enemy.pos.x - (this.enemy.sightDist + ((this.enemy.sightDist === 200) ? 63 : 126));
    else
      this.xPos = this.enemy.pos.x - ((this.enemy.sightDist === 200) ? 63 : 126);
    this._super(me.Entity, 'init', [this.xPos, enemy.pos.y+13, settings]);
    this.body.setVelocity(0, 0);
  },

  update: function(){
    this.renderable.flipX(this.enemy.walkLeft);
    if(this.enemy.walkLeft)
      this.pos.x = this.enemy.pos.x - (this.enemy.sightDist + ((this.enemy.sightDist === 200) ? 63 : 126));
    else
      this.pos.x = this.enemy.pos.x - ((this.enemy.sightDist === 200) ? 63 : 126);
    this.pos.y = this.enemy.pos.y+13;
    this.body.update();
  }
});