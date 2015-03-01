/*------------------- 
a player entity
-------------------------------- */
var afterDie;
game.PlayerEntity = me.Entity.extend({
 
  /* -----
 
  constructor
 
  ------ */
 	
  init: function(x, y, settings) {
    // call the constructor
    this._super(me.Entity, 'init', [x, y, settings]);
    // set the default horizontal & vertical speed (accel vector)
    this.body.setVelocity(5, 15);
 	  this.mode = false;
    this.type = 'player';
    this.walkLeft = false;
    // set the display to follow our position on both axis
    me.game.viewport.follow(this.pos, me.game.viewport.AXIS.BOTH);
 
    // ensure the player is updated even when outside of the viewport
    this.alwaysUpdate = true;
     
    // define a basic walking animation (using all frames)
    this.renderable.addAnimation("walk",  [0, 1, 0, 2]);
    this.renderable.addAnimation("swordWalk",  [3, 4, 3, 5]);
    this.renderable.addAnimation("attack",  [6, 7, 8], 250);
    this.renderable.addAnimation("die",  [9, 10, 11], 225);
    this.renderable.addAnimation("stayDead", [11, 11 , 11], 500);
    // define a standing animation (using the first frame)
    this.renderable.addAnimation("stand",  [0]);
    this.renderable.addAnimation("swordStand",  [3]);
    // set the standing animation as default
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
    if(this.alive && !this.renderable.isCurrentAnimation("attack")){
      if (me.input.isKeyPressed('left')) {
        // flip the sprite on horizontal axis
        this.walkLeft = true;
        this.renderable.flipX(this.walkLeft);
        // update the entity velocity
        this.body.vel.x -= this.body.accel.x * me.timer.tick;
        // change to the walking animation
        if (this.mode == false) {
          if (!this.renderable.isCurrentAnimation("walk")) {
            this.renderable.setCurrentAnimation("walk");
          }
        } else {
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
        if (this.mode == false) {
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
        if (this.mode == false){
          if (this.renderable.isCurrentAnimation("walk"))
         	 this.renderable.setCurrentAnimation("stand");
        } else {
            if (this.renderable.isCurrentAnimation("swordWalk"))
              this.renderable.setCurrentAnimation("swordStand");
        }
      }
     
      if (me.input.isKeyPressed('jump')) {
        // make sure we are not already jumping or falling
        if (!this.body.jumping && !this.body.falling) {
          // set current vel to the maximum defined value
          // gravity will then do the rest
          this.body.vel.y = -this.body.maxVel.y * me.timer.tick;
          // set the jumping flag
          this.body.jumping = true;
        }
      }
      // if (me.input.isKeyPressed('X')) {
      //   if (this.mode == true){
      //   	this.body.vel.x = 0;
      //   	this.renderable.setCurrentAnimation("attack", "swordStand");
      //   }
   	  //} 
   }
 	  else{
      this.body.vel.x = 0;
    }
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
    // Make all other objects solid
    if (response.b.type === 'sword'){
      this.mode = true;
    }
    //else if (this.alive && response.b.body.collisionType === me.collision.types.ENEMY_OBJECT){
    // if (response.b.body.collisionType === me.collision.types.ENEMY_OBJECT){
    //   this.renderable.setCurrentAnimation('die', 'stayDead');
    //   this.alive = false;
    // }
      // if (this.alive && (response.overlapV.y > 0)){
      //               this.renderable.flicker(750);
      // }
      // else if(player.walkLeft === this.walkLeft){
      //     if((this.walkLeft && this.pos.x < player.pos.x) || (!this.walkLeft && this.pos.x > player.pos.x)){
      //       this.alive = false;
      //       this.body.setCollisionMask(me.collision.types.NO_OBJECT);
      //       me.game.world.removeChild(this);
      //     }
      // }
    //}
    return true;
  }
});
/*----------------
  a Coin entity
 ----------------- */
game.CoinEntity = me.CollectableEntity.extend({
  // extending the init function is not mandatory
  // unless you need to add some extra initialization
  init: function(x, y, settings) {
    // call the parent constructor
    this._super(me.CollectableEntity, 'init', [x, y , settings]);
 
  },
 
  // this function is called by the engine, when
  // an object is touched by something (here collected)
  onCollision : function (response, other) {
    // do something when collected
 
    // make sure it cannot be collected "again"
    this.body.setCollisionMask(me.collision.types.NO_OBJECT);
 
    // remove it
    me.game.world.removeChild(this);
     
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
    if(response.a.type === 'player'){
      // give some score
      game.data.score += 1;
      // make sure it cannot be collected "again"
      this.body.setCollisionMask(me.collision.types.NO_OBJECT);
      // remove it
      me.game.world.removeChild(this);
    }
     
    return false
  }
});

/**
 * Enemy Entity
 */
game.EnemyEntity = me.Entity.extend(
{    
    init: function (x, y, settings)
    {
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
        if (this.alive && response.b.body.collisionType !== me.collision.types.COLLECTABLE_OBJECT){
          if (this.alive && player.alive && player.mode){
            if (response.overlapV.y > 0){
              this.renderable.flicker(750);
              return;
            }
            else if((player.walkLeft === this.walkLeft) && ((this.walkLeft && this.pos.x < player.pos.x) || (!this.walkLeft && this.pos.x > player.pos.x))){
              this.alive = false;
              this.body.setCollisionMask(me.collision.types.NO_OBJECT);
              me.game.world.removeChild(this);
              player.renderable.setCurrentAnimation("attack", "stand");
              return;
            }
          }
          this.alive = false;
          player.renderable.setCurrentAnimation("die", function(){player.renderable.setCurrentAnimation("stayDead", function(){me.state.change(me.state.MENU)})});
          player.body.vel.x = 0;
          player.alive = false;
          game.data.score -= 1;
          //player.renderable.setCurrentAnimation("stayDead", function(){me.state.change(me.state.MENU)});
          
        
          //return false;
        }
        //setTimeout(function(){me.state.change(me.state.MENU)}, 1000);
      }
      // Make all other objects solid
      return true;
    }

});