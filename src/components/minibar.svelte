<!----- Second Line ----->
<hr />
<div class="stats flex shadow">
  <div class="stat block">
    <div class="stat-figure text-rose-300">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        class="inline-block w-8 h-8 stroke-current"
        ><path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
        /></svg
      >
    </div>
    <div class="stat-title">
      <a href="../exams/jeemains">Jee Mains 2024</a>
    </div>
    <div id="xtimer1" class="" />
  </div>

  <div class="stat block">
    <div class="stat-figure text-teal-300">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        class="inline-block w-8 h-8 stroke-current"
        ><path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
        /></svg
      >
    </div>
    <div class="stat-title">
      <a href="../exams/jeeadvanced">Jee Adv</a>
    </div>
    <div id="xtimer2" class="" />
  </div>

  <div class="stat block">
    <div class="stat-figure text-orange-400">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        class="inline-block w-8 h-8 stroke-current"
        ><path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
        /></svg
      >
    </div>
    <div class="stat-title"><a href="../exams/neet">NEET 24</a></div>
    <div id="xtimer3" class="" />
  </div>
</div>
<hr />
<!----- Second Line ----->
<div class="stats flex shadow">
  <div class="stat block">
    <div class="stat-figure text-orange-300">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        class="inline-block w-8 h-8 stroke-current"
        ><path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
        /></svg
      >
    </div>
    <div class="stat-title"><a href="../exams/bitsat">BITSAT (S1)</a></div>
    <div id="xtimer4" class="" />
  </div>

  <div class="stat block">
    <div class="stat-figure text-amber-300">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        class="inline-block w-8 h-8 stroke-current"
        ><path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
        /></svg
      >
    </div>
    <div class="stat-title"><a href="../exams/mhtcet">MHT-CET 24</a></div>
    <div id="xtimer5" class="" />
  </div>

  <div class="stat block">
    <div class="stat-figure text-lime-400">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        class="inline-block w-8 h-8 stroke-current"
        ><path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
        /></svg
      >
    </div>
    <div class="stat-title">WBJEE 24</div>
    <div id="xtimer6" class="" />
  </div>
</div>
<hr />

<footer class="footer" />
<!----- TODO: Instead of calculating dates twice, try and use it from timer.astro ----->
<!----- TODO: Take the data stored in localstorage from the jeemains.astro page and use it here ----->
<body>
  <script>
    const today = new Date();

    var eventsx = [
      // JEE Mains [xtimer1]
      { name: "Event x1", datex: new Date("Jan 08, 2024 00:00:00").getTime() },
      // JEE Adv [xtimer2]
      { name: "Event x2", datex: new Date("Jun 04, 2023 00:00:00").getTime() },
      // NEET [xtimer3]
      { name: "Event x3", datex: new Date("May 07, 2024 00:00:00").getTime() },
      // BITSAT [xtimer4]
      { name: "Event x4", datex: new Date("May 21, 2023 00:00:00").getTime() },
      // MHTCET [xtimer5]
      { name: "Event x5", datex: new Date("May 09, 2024 00:00:00").getTime() },
      // WBJEE [xtimer6]
      { name: "Event x6", datex: new Date("Apr 30, 2024 00:00:00").getTime() },
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
              '<span class="font-mono text-4xl ">' +
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
