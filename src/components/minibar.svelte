<footer class="footer"></footer>
<!----- TODO: Instead of calculating dates twice, try and use it from timer.astro ----->
<!----- TODO: Take the data stored in localstorage from the jeemains.astro page and use it here ----->
<body>
  <script>
  const today = new Date();

    var eventsx = [
      // JEE Mains Date [xtimer1]
      { name: "Event x1", datex: new Date("Apr 06, 2023 00:00:00").getTime() },
      // JEE Adv Date [xtimer1]
      { name: "Event x2", datex: new Date("Jun 04, 2023 00:00:00").getTime() },
      // NEET [xtimer2]
      { name: "Event x3", datex: new Date("May 07, 2023 00:00:00").getTime() },
      // BITSAT [xtimer3]
      { name: "Event x4", datex: new Date("May 21, 2023 00:00:00").getTime() },
      // MHTCET [xtimer4]
      { name: "Event x5", datex: new Date("May 09, 2023 00:00:00").getTime() },
      // WBJEE [xtimer5]
      { name: "Event x6", datex: new Date("Apr 30, 2023 00:00:00").getTime() },
    ];

    var countdownsx = [];

    // create countdownsx
    for (var i = 0; i < eventsx.length; i++) {
      var countDownDatex = eventsx[i].datex;
      var timerIdx = "xtimer" + (i + 1);
      var x;

      function startCountdown(idx, datex) {
        x = setInterval(function () {
          var nowx = new Date().getTime();
          var distancex = datex - nowx;
          if (distancex > 0) {
            var daysx = Math.floor(distancex / (1000 * 60 * 60 * 24));
            var hoursx = Math.floor(
              (distancex % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
            );
            var minutesx = Math.floor(
              (distancex % (1000 * 60 * 60)) / (1000 * 60)
            );
            var secondsx = Math.floor((distancex % (1000 * 60)) / 1000);
            var countdownHtml =
              '<div class="grid grid-flow-col gap-5 text-center auto-cols-max">' +
              '<div class="flex flex-col">' +
              '<span class="countdown font-mono text-4xl">' +
              '<span style="--value:' +
              (daysx < 10 ? "0" : "") +
              daysx +
              ';">' +
              (daysx < 10 ? "0" : "") +
              daysx +
              "</span>" +
              "</span>" +
              "days" +
              "</div>" +
              '<div class="flex flex-col">' +
              '<span class="countdown font-mono text-4xl">' +
              '<span style="--value:' +
              (hoursx < 10 ? "0" : "") +
              hoursx +
              ';">' +
              (hoursx < 10 ? "0" : "") +
              hoursx +
              "</span>" +
              "</span>" +
              "hours" +
              "</div>" +
              '<div class="flex flex-col">' +
              '<span class="countdown font-mono text-4xl">' +
              '<span style="--value:' +
              (minutesx < 10 ? "0" : "") +
              minutesx +
              ';">' +
              (minutesx < 10 ? "0" : "") +
              minutesx +
              "</span>" +
              "</span>" +
              "min" +
              "</div>" +
              '<div class="flex flex-col">' +
              '<span class="countdown font-mono text-4xl">' +
              '<span style="--value:' +
              (secondsx < 10 ? "0" : "") +
              secondsx +
              ';">' +
              (secondsx < 10 ? "0" : "") +
              secondsx +
              "</span>" +
              "</span>" +
              "sec" +
              "</div>" +
              "</div>";

            document.getElementById(idx).innerHTML = countdownHtml;
          } else {
            clearInterval(x);
            document.getElementById(idx).innerHTML = "Best of Luck";
          }
        }, 1000);
      }

      countdownsx.push({ idx: timerIdx, datex: countDownDatex });

      startCountdown(timerIdx, countDownDatex);
    }

    // handle event selection change
    function toggleEvent() {
      var currentEvent = document.getElementById("xevent-select").value;
      var countDownDatex = eventsx[currentEvent].datex;
      var timerIdx = " xtimer" + (currentEvent + 1);
      var x;

      clearInterval(countdownsx[currentEvent].x);

      startCountdown(timerIdx, countDownDatex);
    }

    document
      .getElementById("xevent-select")
      .addEventListener("change", toggleEvent);
  </script>
</body>
