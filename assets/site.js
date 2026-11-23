/* Olel Studio, olel.tv: the little bits of play on the home page.
   No cookies, no storage, no requests. Without this file the page is complete and still. */
(function () {
  "use strict";
  var calm = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var stage = document.querySelector(".actors");
  if (!stage) return;

  var cast = {
    tumbo: stage.querySelector(".tumbo"),
    digger: stage.querySelector(".digger"),
    hedgehog: stage.querySelector(".hedgehog"),
    stone: stage.querySelector(".stone"),
    hole: stage.querySelector(".hole")
  };

  /* arrivals: drive in from just outside the screen, wheels turning with the distance */
  function arrivals() {
    var vw = document.documentElement.clientWidth;
    var t = cast.tumbo.getBoundingClientRect();
    var dist = t.right + 30;
    var wheel = cast.tumbo.querySelector(".wheel").getBoundingClientRect().width * 0.912; // tyre, not the crop
    cast.tumbo.style.setProperty("--enter-x", -dist + "px");
    cast.tumbo.style.setProperty("--roll", (-dist / (Math.PI * wheel)) * 360 + "deg");
    cast.tumbo.style.setProperty("--bring-roll", (0.14 * t.width / (Math.PI * wheel)) * 360 + "deg");
    var d = cast.digger.getBoundingClientRect();
    cast.digger.style.setProperty("--enter-x", (vw - d.left + 30) + "px");
  }
  if (!calm && document.visibilityState === "visible") {
    arrivals();
    document.documentElement.classList.add("arrive");
    setTimeout(function () {                       // never leave anyone off stage (a frozen or throttled tab)
      if (!document.getAnimations) return;
      document.getAnimations().forEach(function (a) {
        var n = a.animationName;
        if (n === "drive-in" || n === "roll-in" || n === "dig-in") { try { a.finish(); } catch (e) {} }
      });
    }, 2400);
  }

  /* say a word: the one it belongs to answers, a bubble shows the word */
  var words = {
    truck: { who: "tumbo", act: "hop", colour: "#11695F" },
    stone: { who: "stone", act: "hop", colour: "#7E4C20" },
    apple: { who: "hedgehog", act: "hop", colour: "#B42A24" },
    bring: { who: "tumbo", act: "bring", colour: "#11695F" },
    dig: { who: "digger", act: "dig", colour: "#5E3BB0" },
    hole: { who: "hole", act: "hop", colour: "#5E3BB0", also: "digger" }
  };
  var bubble = stage.querySelector(".bubble");
  var bubbleWord = bubble.querySelector(".bubble-word");
  var live = document.getElementById("said");
  var timers = {};

  function visible(el) { return el && el.getClientRects().length > 0; }

  function later(key, fn, ms) {
    clearTimeout(timers[key]);
    timers[key] = setTimeout(fn, ms);
  }

  function act(el, how) {
    if (how === "dig") {
      el.classList.add("is-digging");
      later("dig", function () { el.classList.remove("is-digging"); }, 1700);
      how = "hop";
      if (calm) return;
    }
    if (calm) return;
    el.classList.remove("hop", "bring");
    void el.offsetWidth;               // restart the animation
    el.classList.add(how);
    later("act-" + how + (el.className.match(/actor (\w+)/) || ["", ""])[1], function () { el.classList.remove(how); }, 2100);
  }

  function say(word) {
    var w = words[word];
    if (!w) return;
    var el = cast[w.who];
    if (!visible(el)) el = cast[w.also] || el;
    if (w.who === "hole" && !visible(cast.hole)) { act(cast.digger, "dig"); }
    else {
      act(el, w.act);
      if (w.also) act(cast[w.also], "dig");
    }
    if (el === cast.tumbo) {
      el.classList.add("is-happy");
      later("happy", function () { el.classList.remove("is-happy"); }, 1900);
    }
    // the bubble, above the one who answers
    var s = stage.getBoundingClientRect(), r = el.getBoundingClientRect();
    var x = ((r.left + r.width * (el === cast.tumbo ? 0.62 : 0.5)) - s.left) / s.width * 100;
    var y = (s.bottom - r.top) / s.height * 100 + 2;
    x = Math.max(9, Math.min(91, x));
    y = Math.min(y, 96);
    bubble.style.setProperty("--bx", x + "%");
    bubble.style.setProperty("--by", y + "%");
    bubble.style.setProperty("--word", w.colour);
    bubble.classList.remove("show");
    bubbleWord.textContent = word.charAt(0).toUpperCase() + word.slice(1) + "!";
    void bubble.offsetWidth;
    bubble.classList.add("show");
    later("bubble", function () { bubble.classList.remove("show"); }, 1800);
    live.textContent = word;
    document.querySelectorAll(".chip").forEach(function (c) {
      c.classList.toggle("is-on", c.getAttribute("data-say") === word);
    });
    later("chip", function () {
      document.querySelectorAll(".chip.is-on").forEach(function (c) { c.classList.remove("is-on"); });
    }, 1800);
  }

  document.addEventListener("click", function (e) {
    var b = e.target.closest("[data-say]");
    if (b) say(b.getAttribute("data-say"));
  });

  /* the video: plays silently while it is on screen (with reduced motion it waits for a tap) */
  var video = document.querySelector("video.moment");
  if (video && !calm && "IntersectionObserver" in window) {
    video.removeAttribute("controls");
    video.muted = true;
    new IntersectionObserver(function (es) {
      es.forEach(function (en) {
        if (en.isIntersecting) { video.preload = "auto"; var p = video.play(); if (p && p.catch) p.catch(function () {}); }
        else video.pause();
      });
    }, { threshold: 0.35 }).observe(video);
  }

  /* parallax: the far hills move a little slower than the page */
  if (calm) return;
  var layers = Array.prototype.slice.call(document.querySelectorAll("[data-depth]"));
  var hero = document.querySelector(".hero");
  var ticking = false;
  function paint() {
    ticking = false;
    var y = window.scrollY || window.pageYOffset;
    if (y > hero.offsetHeight + 200) return;
    layers.forEach(function (l) {
      l.style.transform = "translate3d(0," + (y * parseFloat(l.getAttribute("data-depth"))).toFixed(1) + "px,0)";
    });
  }
  window.addEventListener("scroll", function () {
    if (!ticking) { ticking = true; window.requestAnimationFrame(paint); }
  }, { passive: true });
})();
