<script>
    import { onMount } from 'svelte';
    import examsData from '../data/2025.json';
    
    let year = 2025; 
    let { exams } = examsData;
    let countdowns = [];
    let showAddForm = false;
    let availableExams = [];
    
    const pageName = window.location.pathname.split('/').filter(Boolean).pop() || 'home';
    const getStorageKey = (key) => `${pageName}_${key}`;
    
    const colorOptions = [
      { name: 'Rose', value: 'rose-300' },
      { name: 'Blue', value: 'blue-500' },
      { name: 'Green', value: 'green-500' },
      { name: 'Yellow', value: 'yellow-500' },
      { name: 'Purple', value: 'purple-500' },
      { name: 'Pink', value: 'pink-500' },
      { name: 'Indigo', value: 'indigo-500' },
      { name: 'Teal', value: 'teal-500' },
      { name: 'Orange', value: 'orange-500' },
      { name: 'Cyan', value: 'cyan-500' },
    ];
    
    const createEventObject = (exam) => ({
      name: `${exam.name} ${exam.year || year}`,
      date: new Date(`${exam.month} ${exam.day}, ${exam.year || year} 00:00:00`).getTime(),
      color: exam.color
    });
    
    const initializeCountdowns = () => {
      let savedCountdowns = JSON.parse(localStorage.getItem(getStorageKey('countdowns')));
      let savedAvailableExams = JSON.parse(localStorage.getItem(getStorageKey('availableExams')));
      let savedYear = localStorage.getItem(getStorageKey('year'));
    
      if (savedYear) {
        year = parseInt(savedYear);
      } else {
        year = 2025;
      }
    
      if (savedCountdowns && savedAvailableExams) {
        countdowns = savedCountdowns;
        availableExams = savedAvailableExams;
      } else {
        countdowns = exams.slice(0, 3).map((exam, index) => ({
          ...createEventObject(exam),
          timerIdx: `${pageName}_timer${index + 1}`,
          remaining: { days: 0, hours: 0, minutes: 0, seconds: 0 }
        }));
        availableExams = exams.slice(3);
      }
    };
    
    const saveToLocalStorage = () => {
      localStorage.setItem(getStorageKey('countdowns'), JSON.stringify(countdowns));
      localStorage.setItem(getStorageKey('availableExams'), JSON.stringify(availableExams));
      localStorage.setItem(getStorageKey('year'), year.toString());
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
        day: parseInt(form.day.value),
        color: form.color.value,
        year: parseInt(form.year.value)
      };
      const examObject = createEventObject(newExam);
      countdowns = [...countdowns, {
        ...examObject,
        timerIdx: `${pageName}_timer${countdowns.length + 1}`,
        remaining: { days: 0, hours: 0, minutes: 0, seconds: 0 }
      }];
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
      countdowns = [...countdowns, {...createEventObject(exam), timerIdx: `${pageName}_timer${countdowns.length + 1}`, remaining: { days: 0, hours: 0, minutes: 0, seconds: 0 }}];
      availableExams = availableExams.filter(e => e.name !== exam.name);
      saveToLocalStorage();
    };
    
    const removeAvailableExam = (index) => {
      availableExams = availableExams.filter((_, i) => i !== index);
      saveToLocalStorage();
    };
    
    const updateYear = (newYear) => {
      year = parseInt(newYear);
      countdowns = countdowns.map(countdown => ({
        ...countdown,
        ...createEventObject({
          name: countdown.name.replace(/\d{4}$/, year),
          month: new Date(countdown.date).toLocaleString('default', { month: 'long' }),
          day: new Date(countdown.date).getDate(),
          color: countdown.color
        })
      }));
      saveToLocalStorage();
    };
    </script>
    
    {#each Array(Math.ceil(countdowns.length / 3)) as _, rowIndex}
      <div class="stats flex shadow border-y border-x border-gray-600">
        {#each countdowns.slice(rowIndex * 3, rowIndex * 3 + 3) as countdown, index}
          <div class="stat block relative group">
            <button on:click={() => removeExam(rowIndex * 3 + index)} class="btn btn-sm btn-circle absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity">✕</button>
            <div class="stat-figure">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" class="inline-block w-8 h-8 stroke-current text-{countdown.color}">
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
      <button on:click={toggleAddForm} class="btn bg-[#212121] shadow border-y border-x border-gray-600 text-[#f1f5f9] hover:bg-[#f1f5f9]/40 h-8 rounded-md px-3 text-xs w-full mt-6 mb-6">
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
            <option value="">Select Color</option>
            {#each colorOptions as color}
              <option value={color.value}>{color.name}</option>
            {/each}
          </select>
          <input 
            name="year" 
            type="number" 
            placeholder="Year" 
            bind:value={year}
            class="input input-bordered"
          />
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
    