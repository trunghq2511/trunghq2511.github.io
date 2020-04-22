(function($){
  'use strict';
  /*var
  ----------------------------------------------------------------------*/
  var DATAPREF = '-cmnjs';
  var globalKey = 'cmnjs';

  if(globalKey && window[globalKey]==null){
    window[globalKey]={};
  }else{
    globalKey = false;
  }

  /*utility
  ----------------------------------------------------------------------*/
  /**
  * UA判別
  */
  var UAINFO = (function(){
    var ua = navigator.userAgent.toLowerCase();
    //browser
    var ie = !!ua.match(/(msie|trident)/i);
    var edge = !!ua.match(/edge/i);
    var chrome = edge ? false : !!ua.match(/(chrome|crios)/i);
    var safari = (edge || chrome) ? false : !!ua.match(/safari/i);
    var firefox = !!ua.match(/firefox/i);
    //mobile device and os
    var iPhone = ua.indexOf('iphone') >= 0;
    var iPod = ua.indexOf('ipod') >= 0;
    var iPad = ua.indexOf('ipad') >= 0;
    var iOS = (iPhone || iPod || iPad);
    var Android = ua.indexOf('android') >= 0;
    var TB = (iPad || (Android && ua.indexOf('mobile') < 0));
    var SP = (!TB && (iOS || Android));
    return {
      IE: ie,
      Edge: edge,
      Chrome: chrome,
      Safari: safari,
      Firefox: firefox,
      
      iOS: iOS,
      iOS_SP: (iOS && SP),
      iOS_TB: (iOS && TB),
      Android: Android,
      Android_SP: (Android && SP),
      Android_TB: (Android && TB),
      TB: TB,
      SP: SP,
      iOS_Android: (iOS || Android)
    };
  })();
  if(globalKey){window[globalKey].UAINFO = UAINFO;}


  /**
  * クッキー操作
  */
  var COOKIECTRL = {
    get: function(name) {
      var cookies = document.cookie.split(';');
      for (var index = 0, length = cookies.length; index < length; index += 1) {
        var temp = cookies[index].replace(/\s/g, '').split('=');
        if(temp[0] === name){
          return decodeURIComponent(temp[1]);
        }
      }
      return null;
    },
    set: function(name, value, expires, path, domain, secure){
      var d = document;
      var today = new Date();
      if (expires){
        expires = expires * 1000 * 60 * 60 * 24;
      }
      var expires_date = new Date( today.getTime() + (expires));
      d.cookie = name+'='+encodeURIComponent(value) +
        ((expires)? ';expires='+expires_date.toUTCString() : '') +
        ((path)? ';path=' + path : '')+
        ((domain)? ';domain=' + domain : '')+
        ((secure)? ';secure' : '' );
    },
    del: function(name, path, domain){
      var d = document;
      if (this.get(name)){
        d.cookie = name + '=' +
          ((path)? ';path=' + path : '') +
          ((domain)? ';domain=' + domain : '') +
          ';expires=Thu, 01-Jan-1970 00:00:01 GMT';
      }
    }
  };
  if(globalKey){window[globalKey].COOKIECTRL = COOKIECTRL;}


  /*module
  ----------------------------------------------------------------------*/
  /**
  * 文字サイズ切替
  * 切替ボタンでhtml要素に所定のクラスを付与　クッキーfontSizeChangeで保持し読み込み時にも反映
  *  切替ボタン 大：[data-cmnjs-fontsizechange=L]
  *  切替ボタン 中：[data-cmnjs-fontsizechange=M]
  *  切替ボタン 小：[data-cmnjs-fontsizechange=S]
  *  htmlタグに付与されるクラス 大：fontSizeL
  *  htmlタグに付与されるクラス 中：なし
  *  htmlタグに付与されるクラス 小：fontSizeS
  */
  (function(){
    var config = {
      sets: [
        {
          cls: 'fontSizeS',
          btn: '[data'+DATAPREF+'-fontsizechange=S]'
        },
        {
          cls: null,
          btn: '[data'+DATAPREF+'-fontsizechange=M]'
        },
        {
          cls: 'fontSizeL',
          btn: '[data'+DATAPREF+'-fontsizechange=L]'
        }
      ],
      cookieConf:{
        name: 'fontSizeChange',
        path: '/',
        exp: 365*2
      }
    };
    //main function
    var changeRootClass = (function(){
      var $rootElm = $('html');
      return function(seq){
        var addCls = '',
          removeCls = '',
          thisCls,i;
        for(i=0; i<config.sets.length; i++){
          thisCls = config.sets[i].cls;
          if(thisCls){
            if(i === seq){
              addCls = thisCls;
            }else{
              removeCls += thisCls + ' ';
            }
          }
        }
        $rootElm.removeClass(removeCls).addClass(addCls);
        //cookie
        if(!addCls){
          COOKIECTRL.del(config.cookieConf.name, config.cookieConf.path);
        }else{
          COOKIECTRL.set(config.cookieConf.name, seq, config.cookieConf.exp, config.cookieConf.path);
        }
      };
    })();
    //init by saved cookie
    (function(savedCookieVal){
      if(savedCookieVal !== null){
        changeRootClass(Number(savedCookieVal));
      }
    })(COOKIECTRL.get(config.cookieConf.name));
    //btn events
    $(function(){
      var thisData;
      var clickEvent = function(e){
        this.blur();
        changeRootClass(e.data.seq);
      };
      for(var i=0; i<config.sets.length; i++){
        thisData = config.sets[i];
        $(thisData.btn).on('click',{seq:i},clickEvent);
      }
    });
  })();


  /**
  * スムーズスクロール
  * 対象　[href^="#"][data-cmnjs-smoothscroll]
  */
  $(function() {
    var dataName = 'data'+DATAPREF+'-smoothscroll';
    var speed = 300;
    var easing = 'swing';
    var $scroller = $('html,body');
    $(document).on('click', '[href^="#"]['+dataName+']', function(){
      var $this = $(this);
      var pos;
      var href = $this.attr('href');
      var $target = $(href === '#'? 'html' : href);
      if($target.length){
        pos = $target.offset().top;
        $scroller.animate({scrollTop:pos}, speed, easing);
        return false;
      }else{
        return true;
      }
    });
  });


  /**
  * 電話番号リンク
  * 対象　*[data-cmnjs-tellink]
  * 対象要素に対し上記属性値の値でtel:プロトコルのhref属性を持ったaタグに変換
  * Android、iOSのUAのみ実行
  * ex) <span data-cmnjs-tellink="117">時報</span>　→　<a href="tel:117">時報</a>
  */
  $(function(){
    var dataName = 'data'+DATAPREF+'-tellink';
    if(UAINFO.iOS_Android){
      $('['+dataName+']').each(function(){
        var $this = $(this);
        $this.wrapInner('<a href="tel:'+$this.attr(dataName)+'" />').children().unwrap();
      });
    }
  });


  /**
  * タブ切替
  * ボタンのクリックでボタンと対象エリアにアクティブクラスを付与
  * ボタンとエリアの紐付けはDOM順番に依存
  */
  
  //constructor
  var TabChange = function(opt){
    var thisO = this;
    var def = opt.def-0||0;
    this.curSeq = -1;
    this.$btns = opt.$btns;
    this.$areas = opt.$areas;
    this.activeBtnClass = opt.activeBtnClass || '';
    this.activeAreaClass = opt.activeAreaClass || '';
    this.onChanged = (typeof opt.onChanged === 'function')?opt.onChanged:function(){};
    this.$btns.each(function(seq){
      var $this = $(this);
      $this.on('click',function(){
        this.blur();
        thisO.changeTab(seq);
      });
    });
    this.changeTab(def,true);
  };
  TabChange.prototype.changeTab = function(seq,firstFlg){
    if(this.curSeq === seq){
      return;
    }
    var $activeArea = this.$areas.eq(seq);
    if(!firstFlg && $activeArea.is(':visible')){
      return;
    }
    this.$btns.removeClass(this.activeBtnClass);
    this.$btns.eq(seq).addClass(this.activeBtnClass);
    this.$areas.removeClass(this.activeAreaClass);
    $activeArea.addClass(this.activeAreaClass);
    this.curSeq = seq;
    this.onChanged(seq);
  };
  if(globalKey){window[globalKey].TabChange = TabChange;}
  
  $(function(){
    /**
    * ラッパー汎用型 TabChange の生成
    *  ラッパー：[data-cmnjs-tabchange-role="wrap"]
    *  ボタン　：[data-cmnjs-tabchange-role="wrap"] [data-cmnjs-tabchange-role="btn"]
    *  エリア　：[data-cmnjs-tabchange-role="wrap"] [data-cmnjs-tabchange-role="area"]
    *  アクティブボタン・エリアに付与されるクラス：tabActive
    *  ラッパーの data-cmnjs-tabchange-def 属性で初期タブのシーケンスを指定可
    */
    var wrapData = 'data'+DATAPREF+'-tabchange-role=wrap';
    var btnData = 'data'+DATAPREF+'-tabchange-role=btn';
    var areaData = 'data'+DATAPREF+'-tabchange-role=area';
    var defaultSeqData = 'data'+DATAPREF+'-tabchange-def';
    var activeClass = 'tabActive';

    $('['+wrapData+']').each(function(){
      var $wrap = $(this);
      var $nested = $wrap.find('['+wrapData+']'+' *');//ネストを考慮
      var $btns = $wrap.find('['+btnData+']').not($nested);
      var $areas = $wrap.find('['+areaData+']').not($nested);
      if($btns.length && $areas.length){
        new TabChange({
          $btns: $btns,
          $areas: $areas,
          activeBtnClass: activeClass,
          activeAreaClass: activeClass,
          def: $wrap.attr(defaultSeqData),
        });
      }
    });
  });


  /**
  * アコーディオン
  * ボタンのクリックでボタンにアクティブクラスを付与し、対応するエリアを開閉アニメーション
  * 開閉後displayスタイルを取り除き、エリアにアクティブクラスを付与する
  */
  //constructor
  var Accordion = function(opt){
    var thisO = this;
    this.$btn = opt.$btn;
    this.$area = opt.$area;
    this.activeBtnClass = opt.activeBtnClass || '';
    this.activeAreaClass = opt.activeAreaClass || '';
    this.openedFlg = opt.openedFlg;
    this.speed = opt.speed||200;
    this.onBeforeDisplayChange = opt.onBeforeDisplayChange || function(){};
    this.onAfterDisplayChange  = opt.onAfterDisplayChange  || function(){};
    this.busyFlg = false;
    this.useDisplayCheck = !!opt.useDisplayCheck;
    this.$btn.on('click',function(){
      this.blur();
      thisO.displayChange(!thisO.openedFlg);
    });
    this.displayChange(thisO.openedFlg, true, true);
  };
  Accordion.prototype.displayChange = function(flg, noAnimationFlg, initFlg){
    var visibleCheck,hasActiveClass;
    if(!initFlg && this.useDisplayCheck){
      if(flg){
        hasActiveClass = this.$area.hasClass(this.activeAreaClass);
        visibleCheck = this.$area.is(':visible');
        if(visibleCheck){return;}
        this.$area.addClass(this.activeAreaClass);
        visibleCheck = this.$area.is(':visible');
        if(!hasActiveClass){
          this.$area.removeClass(this.activeAreaClass);
        }
        if(!visibleCheck){return;}
      }else{
        hasActiveClass = this.$area.hasClass(this.activeAreaClass);
        visibleCheck = this.$area.is(':visible');
        if(!visibleCheck){return;}
        this.$area.removeClass(this.activeAreaClass);
        visibleCheck = this.$area.is(':visible');
        if(hasActiveClass){
          this.$area.addClass(this.activeAreaClass);
        }
        if(visibleCheck){return;}
      }
    }
    if(this.busyFlg){return;}
    this.busyFlg = true;
    if(this.onBeforeDisplayChange(flg) === false){
      this.busyFlg = false;
      return;
    }
    var thisO = this;
    var speed = noAnimationFlg? 0: this.speed;
    if(flg){//open
      this.$btn.addClass(this.activeBtnClass);
      this.$area.slideDown(speed,'swing',function(){thisO.displayChangeCallback(flg);});
    }else{//close
      this.$btn.removeClass(this.activeBtnClass);
      this.$area.slideUp(speed,'swing',function(){thisO.displayChangeCallback(flg);});
    }
  };
  Accordion.prototype.displayChangeCallback = function(flg){
    this.openedFlg = flg;
    if(flg){
      this.$area.addClass(this.activeAreaClass);
    }else{
      this.$area.removeClass(this.activeAreaClass);
    }
    this.$area.css({display:''});
    this.onAfterDisplayChange(flg);
    this.busyFlg = false;
  };
  if(globalKey){window[globalKey].Accordion = Accordion;}
  
  $(function(){
    /**
    * ラッパー汎用型Accordionの生成
    *  ラッパー：[data-cmnjs-accordion-role="wrap"]
    *  ボタン　：[data-cmnjs-accordion-role="wrap"] [data-cmnjs-accordion-role="btn"]
    *  エリア　：[data-cmnjs-accordion-role="wrap"] [data-cmnjs-accordion-role="area"]
    *  アクティブボタン・エリアに付与されるクラス：accordionActive
    *  ラッパーの data-cmnjs-accordion-active 属性の指定があれば初期状態で開く
    */
    var wrapData = 'data'+DATAPREF+'-accordion-role=wrap';
    var btnData = 'data'+DATAPREF+'-accordion-role=btn';
    var areaData = 'data'+DATAPREF+'-accordion-role=area';
    var activeClass = 'accordionActive';
    var defaultOpendData = 'data'+DATAPREF+'-accordion-active';

    //ラッパー汎用型生成
    $('['+wrapData+']').each(function(){
      var $wrap = $(this);
      var $nested = $wrap.find('['+wrapData+']'+' *');//ネストを考慮
      var $btn = $wrap.find('['+btnData+']').not($nested);
      var $area = $wrap.find('['+areaData+']').not($nested);
      if($btn.length && $area.length){
        new Accordion({
          $btn: $btn,
          $area: $area,
          activeBtnClass: activeClass,
          activeAreaClass: activeClass,
          openedFlg: (typeof $wrap.attr(defaultOpendData) !== 'undefined'),
          useDisplayCheck: true
        });
      }
    });
  });

  /*
  * 可視領域相対位置監視コンストラクタ
  */
  var Poswatch = function(opt){
    var thisO = this;
    this.$target = opt.$target;
    this.infrontClass = opt.infrontClass || '';
    this.scrolledClass = opt.scrolledClass || '';
    this.scrollThreshold = opt.scrollThreshold || 0;
    this.posClasses = $.extend({
      bottomDw: '',
      bottomOn: '',
      bottomUp: '',
      topDw: '',
      topOn: '',
      topUp: ''
    },opt.posClasses || {});

    $(window).on('scroll resize',function(){
      thisO.checkPosition();
    });
    this.checkPosition();
  };
  Poswatch.prototype.checkPosition = (function(){
    var $body = $();
    $(function(){$body = $('body');});
    return function(){
      //しきい値のスクロール判定
      if(window.pageYOffset >= this.scrollThreshold){
        this.$target.addClass(this.scrolledClass);
      }else{
        this.$target.removeClass(this.scrolledClass);
      }
      //ベース位置の通過判定
      var bodyBorderTop =  0;//offset().topがbodyのborderTopを反映しないため補正
      if($body.length){
        bodyBorderTop = Number($body.css('borderTopWidth').replace('px',''));
        bodyBorderTop = isNaN(bodyBorderTop)?0:bodyBorderTop;
      }
      var targetH = this.$target.outerHeight();
      var targetT = this.$target.offset().top+bodyBorderTop;

      if(window.pageYOffset > targetT+targetH){
        this.$target.removeClass(this.posClasses.topOn+' '+this.posClasses.topDw).addClass(this.posClasses.topUp);
      }else if(window.pageYOffset > targetT){
        this.$target.removeClass(this.posClasses.topUp+' '+this.posClasses.topDw).addClass(this.posClasses.topOn);
      }else{
        this.$target.removeClass(this.posClasses.topUp+' '+this.posClasses.topOn).addClass(this.posClasses.topDw);
      }
      if(window.pageYOffset+window.innerHeight < targetT){
        this.$target.removeClass(this.posClasses.bottomUp+' '+this.posClasses.bottomOn).addClass(this.posClasses.bottomDw);
      }else if(window.pageYOffset+window.innerHeight < targetT+targetH){
        this.$target.removeClass(this.posClasses.bottomUp+' '+this.posClasses.bottomDw).addClass(this.posClasses.bottomOn);
      }else{
        this.$target.removeClass(this.posClasses.bottomDw+' '+this.posClasses.bottomOn).addClass(this.posClasses.bottomUp);
      }
    };
  })();
  if(globalKey){window[globalKey].Poswatch = Poswatch;}
  $(function(){
    /*
    * 汎用可視領域相対位置監視
    * 対象要素：[data-cmnjs-poswatch]
    * 100px以上スクロールした場合に付与するクラス：poswatchLittleSclolled
    * 要素がウィンドウの下辺よりも下にいる場合に付与するクラス:poswatchBottomDw
    * 要素がウィンドウの下辺に重なっている場合に付与するクラス:poswatchBottomOn
    * 要素がウィンドウの下辺よりも上にいる場合に付与するクラス:poswatchBottomUp
    * 要素がウィンドウの上辺よりも下にいる場合に付与するクラス:poswatchTopDw
    * 要素がウィンドウの上辺に重なっている場合に付与するクラス:poswatchTopOn
    * 要素がウィンドウの上辺よりも上にいる場合に付与するクラス:poswatchTopUp
    */
    var poswatchData = 'data'+DATAPREF+'-poswatch';
    $('['+poswatchData+']').each(function(){
      new Poswatch({
        $target: $(this),
        posClasses: {
          bottomDw: 'poswatchBottomDw',
          bottomOn: 'poswatchBottomOn',
          bottomUp: 'poswatchBottomUp',
          topDw: 'poswatchTopDw',
          topOn: 'poswatchTopOn',
          topUp: 'poswatchTopUp',
        },
        scrolledClass: 'poswatchLittleSclolled',
        scrollThreshold: 100
      });
    });
  });

})(jQuery);