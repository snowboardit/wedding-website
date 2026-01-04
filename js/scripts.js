$(document).ready(function () {
  /** setup engaged/married content toggle **/
  const idsEngagement = [
      // nav links
      "hitched",
      "link-invitation",
      "link-intro",
      "link-eng-pics",
      "link-events",
      "link-where",
      "link-registry",
      // sections
      "hero-engaged",
      "invitation",
      "intro",
      "eng-pics",
      "events",
      "where",
      "video-bg",
      "map",
      "registry",
    ],
    idsHitched = [
      // nav links
      "engagement",
      "link-outro",
      "link-where",
      "link-wed-pics",
      "link-registry",
      // sections
      "hero-hitched",
      "outro",
      "wed-pics",
      "where",
      "video-bg",
      "registry",
    ],
    transition = function (from, to) {
      const sectionsExcluded = from.filter((s) => !to.includes(s));

      // hide existing sections that aren't in the sections we are showing
      for (const excluded of sectionsExcluded) {
        try {
          // console.info(`hiding #${excluded}`);
          $(`#${excluded}`).removeClass("isActive");
          $(`#${excluded}`).addClass("isInactive");
        } catch (err) {
          console.error(`unable to hide section: ${excluded}`, err);
        }
      }
      // show sections
      for (const t of to) {
        try {
          // console.info(`showing #${to}`);
          $(`#${t}`).removeClass("isInactive");
          $(`#${t}`).addClass("isActive");
        } catch (err) {
          console.error(`unable to show section: ${t}`, err);
        }
      }
    };

  $("#hitched").click(function () {
    transition(idsEngagement, idsHitched);
  });

  $("#engagement").click(function () {
    transition(idsHitched, idsEngagement);
  });

  /******* Wedding Photos Auto Loader ********/
  const GALLERY_BASE_URL = "https://d1pwsbdw60gj7u.cloudfront.net",
    GALLERY_CONFIG = {
      baseUrl: GALLERY_BASE_URL,
      manifestUrl: `${GALLERY_BASE_URL}/gallery.json`,
      pageSize: 24,
      cursor: 0,
      items: [],
      loading: false,
      done: false,
    },
    wedPicsInit = async function () {
      const $grid = $("#wed-pics-grid"),
        sentinel = document.getElementById("wed-pics-sentinel");

      if ($grid.length === 0 || !sentinel) {
        console.warn("wed pics grid/sentinel not found; skipping loader");
        return;
      }

      // Fetch manifest once
      try {
        GALLERY_CONFIG.loading = true;

        const res = await fetch(GALLERY_CONFIG.manifestUrl, {
          // if you version your manifest, you can use default cache
          cache: "default",
        });

        if (!res.ok) {
          console.error(
            "failed to fetch wedding gallery manifest:",
            res.status,
          );
          return;
        }

        const data = await res.json();
        GALLERY_CONFIG.items = Array.isArray(data.items) ? data.items : [];
      } catch (err) {
        console.error("error fetching wedding gallery manifest:", err);
        return;
      } finally {
        GALLERY_CONFIG.loading = false;
      }

      const renderNext = function () {
        if (GALLERY_CONFIG.loading || GALLERY_CONFIG.done) return;

        GALLERY_CONFIG.loading = true;

        const start = GALLERY_CONFIG.cursor,
          end = Math.min(
            start + GALLERY_CONFIG.pageSize,
            GALLERY_CONFIG.items.length,
          );

        if (start >= end) {
          GALLERY_CONFIG.done = true;
          GALLERY_CONFIG.loading = false;
          return;
        }

        // Build DOM for this page
        let $batch = $();
        for (let i = start; i < end; i++) {
          const item = GALLERY_CONFIG.items[i],
            alt = "";

          console.log(`item ${i}`, item);

          if (!item?.thumb?.url || !item?.large?.url) continue;

          const $col = $(`<div class="wed-masonry-item"></div>`),
            $a = $(
              `<a class="fancybox" rel="wedding" href="${item.large.url}"></a>`,
            ),
            $wrap = $(
              `<div class="img-wrap">
                <div class="overlay">
                  <i class="fa fa-search"></i>
                </div>
              </div>`,
            ),
            // Note: keep the <img> lean; browser will lazy-load.
            // Add width/height if you include them in your manifest to reduce layout shift.
            $img = $(
              `<img loading="lazy" decoding="async" src="${item.thumb.url}" width="${item.thumb.w}" height="${item.thumb.h}" alt="${alt}" />`,
            );

          $wrap.append($img);
          $a.append($wrap);
          $col.append($a);

          // Accumulate
          $batch = $batch.add($col);
        }

        // Append in one go (less layout churn)
        $grid.append($batch);

        $batch.find("a.fancybox").fancybox({
          padding: 4,
          width: 1000,
          height: 800,
        });

        GALLERY_CONFIG.cursor = end;
        if (GALLERY_CONFIG.cursor >= GALLERY_CONFIG.items.length)
          GALLERY_CONFIG.done = true;

        GALLERY_CONFIG.loading = false;
      };

      // Render first page immediately so it isn't blank
      renderNext();

      // Auto-load more when sentinel approaches viewport
      const observer = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (!entry.isIntersecting) continue;
            renderNext();
            if (GALLERY_CONFIG.done) observer.disconnect();
          }
        },
        {
          root: null,
          rootMargin: "800px 0px 800px 0px", // start loading before they hit the bottom
          threshold: 0.01,
        },
      );

      observer.observe(sentinel);

      // Optional: if user toggles sections, ensure we render at least one page when wed-pics becomes visible.
      // (IntersectionObserver won't fire if sentinel is display:none.)
      const ensureVisibleRender = function () {
        const isActive = $("#wed-pics").hasClass("active");
        if (isActive && GALLERY_CONFIG.cursor === 0 && !GALLERY_CONFIG.loading)
          renderNext();
      };

      $("#hitched").on("click", ensureVisibleRender);
      $("#engagement").on("click", ensureVisibleRender);
    };

  // Kick it off
  wedPicsInit().catch((err) => console.error("wedPicsInit failed:", err));

  /***************** Waypoints ******************/

  $(".wp1").waypoint(
    function () {
      $(".wp1").addClass("animated fadeInLeft");
    },
    {
      offset: "75%",
    },
  );
  $(".wp2").waypoint(
    function () {
      $(".wp2").addClass("animated fadeInRight");
    },
    {
      offset: "75%",
    },
  );
  $(".wp3").waypoint(
    function () {
      $(".wp3").addClass("animated fadeInLeft");
    },
    {
      offset: "75%",
    },
  );
  $(".wp4").waypoint(
    function () {
      $(".wp4").addClass("animated fadeInRight");
    },
    {
      offset: "75%",
    },
  );
  $(".wp5").waypoint(
    function () {
      $(".wp5").addClass("animated fadeInLeft");
    },
    {
      offset: "75%",
    },
  );
  $(".wp6").waypoint(
    function () {
      $(".wp6").addClass("animated fadeInRight");
    },
    {
      offset: "75%",
    },
  );
  $(".wp7").waypoint(
    function () {
      $(".wp7").addClass("animated fadeInUp");
    },
    {
      offset: "75%",
    },
  );
  $(".wp8").waypoint(
    function () {
      $(".wp8").addClass("animated fadeInLeft");
    },
    {
      offset: "75%",
    },
  );
  $(".wp9").waypoint(
    function () {
      $(".wp9").addClass("animated fadeInRight");
    },
    {
      offset: "75%",
    },
  );

  /***************** Initiate Flexslider ******************/
  $(".flexslider").flexslider({
    animation: "slide",
  });

  /***************** Initiate Fancybox ******************/

  $(".single_image").fancybox({
    padding: 4,
  });

  $(".fancybox").fancybox({
    padding: 4,
    width: 1000,
    height: 800,
  });

  /***************** Tooltips ******************/
  $('[data-toggle="tooltip"]').tooltip();

  /***************** Nav Transformicon ******************/

  /* When user clicks the Icon */
  $(".nav-toggle").click(function () {
    $(this).toggleClass("active");
    $(".header-nav").toggleClass("open");
    event.preventDefault();
  });
  /* When user clicks a link */
  $(".header-nav li a").click(function () {
    $(".nav-toggle").toggleClass("active");
    $(".header-nav").toggleClass("open");
  });

  /***************** Header BG Scroll ******************/

  $(function () {
    $(window).scroll(function () {
      var scroll = $(window).scrollTop();

      if (scroll >= 20) {
        $("section.navigation").addClass("fixed");
        $("header").css({
          padding: "27px 0",
        });
        $("header .member-actions").css({
          top: "26px",
        });
        $("header .navicon").css({
          top: "34px",
        });
      } else {
        $("section.navigation").removeClass("fixed");
        $("header").css({
          padding: "50px 0",
        });
        $("header .member-actions").css({
          top: "41px",
        });
        $("header .navicon").css({
          top: "48px",
        });
      }
    });
  });
  /***************** Smooth Scrolling ******************/

  $(function () {
    $("a[href*=#]:not([href=#])").click(function () {
      if (
        location.pathname.replace(/^\//, "") ===
          this.pathname.replace(/^\//, "") &&
        location.hostname === this.hostname
      ) {
        var target = $(this.hash);
        target = target.length
          ? target
          : $("[name=" + this.hash.slice(1) + "]");
        if (target.length) {
          $("html,body").animate(
            {
              scrollTop: target.offset().top - 90,
            },
            2000,
          );
          return false;
        }
      }
    });
  });
});

/********************** Service Worker **********************/

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/service-worker.min.js")
      .then((registration) => {
        console.log(
          "Service Worker registered with scope:",
          registration.scope,
        );
      })
      .catch((error) => {
        console.error("Service Worker registration failed:", error);
      });
  });
}
