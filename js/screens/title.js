var sound = true;

game.TitleScreen = me.ScreenObject.extend({
 
  /**    
   *  action to perform on state change
   */
  onResetEvent : function() {
     
    // title screen
    me.game.world.addChild(
      new me.Sprite (
        0,0, 
        me.loader.getImage('title_screen')
      ),
      1
    );

   //Background music(Menu)
    me.audio.playTrack("Savior-or-Sacrifice-Menu");
    // add a new renderable component with the scrolling text
    me.game.world.addChild(new (me.Renderable.extend ({
      // constructor
      init : function() {
        this._super(me.Renderable, 'init', [0, 0, me.game.viewport.width, me.game.viewport.height]);
        // font for the scrolling text
        this.font = new me.BitmapFont("32x32_font", 32);
         
         // a tween to animate the arrow
        this.scrollertween = new me.Tween(this).to({scrollerpos: -2200 }, 10000).onComplete(this.scrollover.bind(this)).start();
     
        this.scroller = "LOVE WILL MAKE YOU DO THINGS YOU NEVER THOUGHT IMAGINABLE!!!     ";
        this.scrollerpos = 600;
      },
       
      // some callback for the tween objects
      scrollover : function() {
        // reset to default value
        this.scrollerpos = 640;
        this.scrollertween.to({scrollerpos: -2200 }, 10000).onComplete(this.scrollover.bind(this)).start();
      },
     
      update : function (dt) {
        return true;
      },
       
      draw : function (renderer) {
        this.font.draw(renderer, "SAVIOR OR SACRIFICE", 200, 260);
        this.font.draw(renderer, "PLAY - ENTER", 200, 340);
        this.font.draw(renderer, "LOAD CHECKPOINT - L", 200, 400);
        this.font.draw(renderer, "MUTE AUDIO - M", 200, 460);
        this.font.draw(renderer, this.scroller, this.scrollerpos, 540);
      },
      onDestroyEvent : function() {
        //just in case
        this.scrollertween.stop();

      }
    })), 2);
     
    // change to play state on press Enter or click/tap
    me.input.bindKey(me.input.KEY.ENTER, "enter", true);
    me.input.bindPointer(me.input.mouse.LEFT, me.input.KEY.ENTER);
    me.input.bindKey(me.input.KEY.L, "load", true);
    //me.input.bindPointer(me.input.mouse.LEFT, me.input.KEY.L);
    me.input.bindKey(me.input.KEY.M, "mute", true);
    //me.input.bindPointer(me.input.mouse.LEFT, me.input.KEY.M);
  
    this.handler = me.event.subscribe(me.event.KEYDOWN, function (action, keyCode, edge) {
      if (action === "enter") {
        // play something on tap / enter
        // this will unlock audio on mobile devices
        me.audio.play("cling");
        me.state.change(me.state.PLAY);
      }
      if (action === "load") {
        me.state.change(me.state.MENU);
      }
      if(action === "mute") {
        if(sound){
          me.audio.stopTrack();
          sound = false;
        }
        else{
          me.audio.playTrack("Savior-or-Sacrifice-Menu");
          sound = true;
        }
      }
      
    });
  },
 
  /**    
   *  action to perform when leaving this screen (state change)
   */
  onDestroyEvent : function() {
    me.input.unbindKey(me.input.KEY.ENTER);
    me.input.unbindPointer(me.input.mouse.LEFT);
    me.event.unsubscribe(this.handler);
    // stop the current audio track
        me.audio.stopTrack();
   }
});