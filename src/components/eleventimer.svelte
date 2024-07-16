<script>
  import { onMount } from 'svelte';
  import examsData from '../data/2026.json';

  const { year, exams } = examsData;

  // Only use the first exam
  const event = {
    name: `${exams[0].name} ${year}`,
    date: new Date(`${exams[0].month} ${exams[0].day}, ${year} 00:00:00`).getTime(),
    color: exams[0].color
  };

  let days = 0;
  let hours = 0;
  let minutes = 0;
  let seconds = 0;
  let countdownFinished = false;

  onMount(() => {
    const countdownInterval = setInterval(() => {
      const now = new Date().getTime();
      const distance = event.date - now;

      if (distance > 0) {
        days = Math.floor(distance / (1000 * 60 * 60 * 24));
        hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        seconds = Math.floor((distance % (1000 * 60)) / 1000);
      } else {
        clearInterval(countdownInterval);
        countdownFinished = true;
      }
    }, 1000);

    return () => {
      clearInterval(countdownInterval);
    };
  });

  $: paddedDays = days.toString().padStart(2, '0');
  $: paddedHours = hours.toString().padStart(2, '0');
  $: paddedMinutes = minutes.toString().padStart(2, '0');
  $: paddedSeconds = seconds.toString().padStart(2, '0');
</script>

<div class="stats flex">
  <div class="stat block">
      {#if !countdownFinished}
        <div class="countdown-content mx-auto flex flex-wrap justify-center gap-5 md:gap-2 text-center">
          <div class="flex flex-col p-2 bg-neutral rounded-box text-neutral-content">
            <span class="font-mono md:text-9xl lg:text-7xl xl:text-9xl">
              <span style="--value:{paddedDays};">{paddedDays}</span>
            </span>
            days
          </div>
          <div class="flex flex-col p-2 bg-neutral rounded-box text-neutral-content">
            <span class="countdown font-mono md:text-9xl lg:text-7xl xl:text-9xl">
              <span style="--value:{paddedHours};">{paddedHours}</span>
            </span>
            hours
          </div>
          <div class="flex flex-col p-2 bg-neutral rounded-box text-neutral-content">
            <span class="countdown font-mono md:text-9xl lg:text-7xl xl:text-9xl">
              <span style="--value:{paddedMinutes};">{paddedMinutes}</span>
            </span>
            min
          </div>
          <div class="flex flex-col p-2 bg-neutral rounded-box text-neutral-content">
            <span class="countdown font-mono md:text-9xl lg:text-7xl xl:text-9xl">
              <span style="--value:{paddedSeconds};">{paddedSeconds}</span>
            </span>
            sec
          </div>
        </div>
      {:else}
        <div class="text-center text-2xl font-bold">Best of Luck</div>
      {/if}
  </div>
</div>