<script>
  import { onMount } from 'svelte';
  import examsData from '../data/2026.json';

  let { year, exams } = examsData;
  let countdowns = [];
  let showAddForm = false;
  let availableExams = [];

  const createEventObject = (exam) => ({
    name: `${exam.name} ${year}`,
    date: new Date(`${exam.month} ${exam.day}, ${year} 00:00:00`).getTime(),
    color: exam.color
  });

  const initializeCountdowns = () => {
    let savedCountdowns = JSON.parse(localStorage.getItem('countdowns'));
    let savedAvailableExams = JSON.parse(localStorage.getItem('availableExams'));

    if (savedCountdowns && savedAvailableExams) {
      countdowns = savedCountdowns;
      availableExams = savedAvailableExams;
    } else {
      countdowns = exams.slice(0, 3).map((exam, index) => ({
        ...createEventObject(exam),
        timerIdx: `xtimer${index + 1}`,
        remaining: { days: 0, hours: 0, minutes: 0, seconds: 0 }
      }));
      availableExams = exams.slice(3);
    }
  };

  const saveToLocalStorage = () => {
    localStorage.setItem('countdowns', JSON.stringify(countdowns));
    localStorage.setItem('availableExams', JSON.stringify(availableExams));
  };

  onMount(() => {
    initializeCountdowns();

    const interval = setInterval(() => {
      const now = new Date().getTime();
      countdowns = countdowns.map(countdown => {
        const distance = countdown.date - now;
        if (distance > 0) {
          return {
            ...countdown,
            remaining: {
              days: Math.floor(distance / (1000 * 60 * 60 * 24)),
              hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
              minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
              seconds: Math.floor((distance % (1000 * 60)) / 1000)
            }
          };
        } else {
          return { ...countdown, remaining: null };
        }
      });
      saveToLocalStorage();
    }, 1000);

    return () => clearInterval(interval);
  });

  const toggleAddForm = () => {
    showAddForm = !showAddForm;
  };

  const addExam = (event) => {
    event.preventDefault();
    const form = event.target;
    const newExam = {
      name: form.name.value,
      month: form.month.value,
      day: form.day.value,
      color: form.color.value
    };
    countdowns = [...countdowns, {...createEventObject(newExam), timerIdx: `xtimer${countdowns.length + 1}`, remaining: { days: 0, hours: 0, minutes: 0, seconds: 0 }}];
    availableExams = availableExams.filter(exam => exam.name !== newExam.name);
    showAddForm = false;
    saveToLocalStorage();
  };

  const removeExam = (index) => {
    const removedExam = countdowns[index];
    countdowns = countdowns.filter((_, i) => i !== index);
    if (!availableExams.some(exam => exam.name === removedExam.name)) {
      availableExams = [...availableExams, { name: removedExam.name.replace(` ${year}`, ''), month: new Date(removedExam.date).toLocaleString('default', { month: 'long' }), day: new Date(removedExam.date).getDate(), color: removedExam.color }];
    }
    saveToLocalStorage();
  };

  const addAvailableExam = (exam) => {
    countdowns = [...countdowns, {...createEventObject(exam), timerIdx: `xtimer${countdowns.length + 1}`, remaining: { days: 0, hours: 0, minutes: 0, seconds: 0 }}];
    availableExams = availableExams.filter(e => e.name !== exam.name);
    saveToLocalStorage();
  };

  const removeAvailableExam = (index) => {
    availableExams = availableExams.filter((_, i) => i !== index);
    saveToLocalStorage();
  };
</script>

{#each Array(Math.ceil(countdowns.length / 3)) as _, rowIndex}
  <div class="stats flex shadow border-y border-x border-gray-600">
    {#each countdowns.slice(rowIndex * 3, rowIndex * 3 + 3) as countdown, index}
      <div class="stat block relative group">
        <button on:click={() => removeExam(rowIndex * 3 + index)} class="btn btn-sm btn-circle absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity">✕</button>
        <div class="stat-figure text-{countdown.color}">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" class="inline-block w-8 h-8 stroke-current">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
        </div>
        <div class="stat-title">
          <p>{countdown.name}</p>
        </div>
        <div id={countdown.timerIdx} class="">
          {#if countdown.remaining}
            <div class="grid grid-flow-col gap-5 text-center auto-cols-max">
              <div class="flex flex-col">
                <span class="font-mono text-4xl">
                  <span style="--value:{countdown.remaining.days.toString().padStart(2, '0')};">{countdown.remaining.days.toString().padStart(2, '0')}</span>
                </span>
                days
              </div>
              <div class="flex flex-col">
                <span class="countdown font-mono text-4xl">
                  <span style="--value:{countdown.remaining.hours.toString().padStart(2, '0')};">{countdown.remaining.hours.toString().padStart(2, '0')}</span>
                </span>
                hours
              </div>
              <div class="flex flex-col">
                <span class="countdown font-mono text-4xl">
                  <span style="--value:{countdown.remaining.minutes.toString().padStart(2, '0')};">{countdown.remaining.minutes.toString().padStart(2, '0')}</span>
                </span>
                min
              </div>
              <div class="flex flex-col">
                <span class="countdown font-mono text-4xl">
                  <span style="--value:{countdown.remaining.seconds.toString().padStart(2, '0')};">{countdown.remaining.seconds.toString().padStart(2, '0')}</span>
                </span>
                sec
              </div>
            </div>
          {:else}
            Best of Luck
          {/if}
        </div>
      </div>
    {/each}
  </div>
{/each}

<div>
  <button on:click={toggleAddForm} class="btn bg-black text-[#f1f5f9] shadow-sm hover:bg-black/80 h-8 rounded-md px-3 text-xs w-full mt-6 mb-2">
    {showAddForm ? 'Cancel' : 'Add Exam'}
  </button>
</div>

{#if showAddForm}
  <form on:submit={addExam} class="mb-4 p-4 border rounded">
    <div class="grid grid-cols-2 gap-4">
      <input name="name" type="text" placeholder="Exam Name" required class="input input-bordered" />
      <input name="month" type="text" placeholder="Month (Jan / Feb / Mar)" required class="input input-bordered" />
      <input name="day" type="number" placeholder="Day" required class="input input-bordered" />
      <select name="color" required class="select select-bordered">
        <option value="colour">Select Color</option>
        <option value="primary">Primary</option>
      </select>
    </div>
    <button type="submit" class="btn btn-primary mt-4">Add Custom Exam</button>
  </form>
  
  {#if availableExams.length > 0}
    <div class="my-4">
      <h3 class="text-lg font-semibold mb-2">Available Exams:</h3>
      <div class="flex flex-wrap gap-2">
        {#each availableExams as exam, index}
          <div class="relative group">
            <button on:click={() => addAvailableExam(exam)} class="btn btn-sm btn-outline">
              {exam.name}
            </button>
            <button on:click={() => removeAvailableExam(index)} class="btn btn-xs btn-circle absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 transition-opacity">✕</button>
          </div>
        {/each}
      </div>
    </div>
  {/if}
{/if}
