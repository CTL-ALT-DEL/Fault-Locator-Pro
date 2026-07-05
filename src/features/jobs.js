const KEY = "fault_locator_pro_2_jobs";

export function getJobs() {
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]");
  } catch {
    return [];
  }
}

export function saveJob(job) {
  const jobs = getJobs();
  jobs.unshift(job);
  localStorage.setItem(KEY, JSON.stringify(jobs.slice(0, 100)));
}

export function clearJobs() {
  localStorage.removeItem(KEY);
}
