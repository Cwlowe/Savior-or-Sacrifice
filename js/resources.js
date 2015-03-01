//game resources
game.resources = [
  /**
   * Graphics.
   */
  // our level tileset
  {name: "area01_level_tiles",  type:"image", src: "data/img/map/area01_level_tiles.png"},
   {name: "area01_bkg01",         type:"image", src: "data/img/area01_bkg01.png"},
   {name: "area01_bkg0",         type:"image", src: "data/img/area01_bkg0.png"},

   // the main player spritesheet
  {name: "mainCharacter",    type:"image", src: "data/img/sprite/sprite_sheet.png"},
  {name: "sword",            type:"image", src: "data/img/sprite/sword.png"},
  {name: "wheelie_right",    type:"image", src: "data/img/sprite/wheelie_right.png"},
  // title screen
  {name: "title_screen",     type:"image", src: "data/img/gui/title_screen.png"},
  // game font
  {name: "32x32_font",       type:"image", src: "data/img/font/32x32_font.png"},
  // the spinning coin spritesheet
  {name: "spinning_coin_gold",  type:"image", src: "data/img/sprite/spinning_coin_gold.png"},
  //Background Menu music 
  {name: "Savior-or-Sacrifice-Menu",  type: "audio", src: "data/bgm/"},
  //In game music
  {name: "Savior-or-Sacrifice-InGame",  type: "audio", src: "data/bgm/"},
  /* 
   * Maps. 
   */
  {name: "area01", type: "tmx", src: "data/map/area01.tmx"},
  {name: "area02", type: "tmx", src: "data/map/area02.tmx"},
  {name: "area03", type: "tmx", src: "data/map/area03.tmx"}
];