export function getInitials(name: string) {
  const words = name.trim().split(/\s+/).filter(Boolean);

  if (words.length >= 2) {
    return `${words[0]![0]}${words[1]![0]}`.toUpperCase();
  }

  return name.slice(0, 2).toUpperCase();
}

export function formatUpcomingEventsCount(count: number) {
  if (count === 0) {
    return "Aucun événement à venir";
  }

  if (count === 1) {
    return "1 événement à venir";
  }

  return `${count} événements à venir`;
}
