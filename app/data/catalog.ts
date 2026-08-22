import type {
  ActivityId,
  AnimalItem,
  ColorItem,
  FeedPair,
  MovementItem,
  NumberItem,
  ShapeItem,
} from "../types/game";

export const COLORS: ColorItem[] = [
  { id: "red", en: "Red", es: "Rojo", hex: "#ff5c68", dark: "#ad2331", emoji: "🍎" },
  { id: "blue", en: "Blue", es: "Azul", hex: "#43a8ff", dark: "#14649f", emoji: "🐳" },
  { id: "yellow", en: "Yellow", es: "Amarillo", hex: "#ffd84a", dark: "#936d00", emoji: "☀️" },
  { id: "green", en: "Green", es: "Verde", hex: "#53cf82", dark: "#16703a", emoji: "🐸" },
  { id: "purple", en: "Purple", es: "Morado", hex: "#a779ec", dark: "#563094", emoji: "🍇" },
  { id: "orange", en: "Orange", es: "Anaranjado", hex: "#ff954f", dark: "#9c4611", emoji: "🍊" },
  { id: "pink", en: "Pink", es: "Rosa", hex: "#ff8fc8", dark: "#b8457a", emoji: "🌸" },
  { id: "brown", en: "Brown", es: "Café", hex: "#c48a5a", dark: "#7a4a28", emoji: "🐻" },
  { id: "black", en: "Black", es: "Negro", hex: "#4a4554", dark: "#2a2633", emoji: "🐈‍⬛" },
  { id: "white", en: "White", es: "Blanco", hex: "#f5f2ea", dark: "#b0a89a", emoji: "☁️" },
];

export const ANIMALS: AnimalItem[] = [
  { id: "dog", en: "Dog", es: "Perro", emoji: "🐶", sound: "bark" },
  { id: "cat", en: "Cat", es: "Gato", emoji: "🐱", sound: "meow" },
  { id: "bird", en: "Bird", es: "Pájaro", emoji: "🐦", sound: "chirp" },
  { id: "frog", en: "Frog", es: "Rana", emoji: "🐸", sound: "ribbit" },
  { id: "cow", en: "Cow", es: "Vaca", emoji: "🐮", sound: "moo" },
  { id: "duck", en: "Duck", es: "Pato", emoji: "🦆", sound: "quack" },
  { id: "horse", en: "Horse", es: "Caballo", emoji: "🐴", sound: "neigh" },
  { id: "sheep", en: "Sheep", es: "Oveja", emoji: "🐑", sound: "baa" },
];

export const SHAPES: ShapeItem[] = [
  { id: "circle", en: "Circle", es: "Círculo", kind: "circle", gardenEmoji: "☀️" },
  { id: "square", en: "Square", es: "Cuadrado", kind: "square", gardenEmoji: "🪟" },
  { id: "triangle", en: "Triangle", es: "Triángulo", kind: "triangle", gardenEmoji: "⛺" },
  { id: "star", en: "Star", es: "Estrella", kind: "star", gardenEmoji: "✨" },
  { id: "heart", en: "Heart", es: "Corazón", kind: "heart", gardenEmoji: "🌸" },
  { id: "oval", en: "Oval", es: "Óvalo", kind: "oval", gardenEmoji: "🍃" },
];

export const NUMBERS: NumberItem[] = [
  { id: "n1", en: "One", es: "Uno", value: 1, digit: "1" },
  { id: "n2", en: "Two", es: "Dos", value: 2, digit: "2" },
  { id: "n3", en: "Three", es: "Tres", value: 3, digit: "3" },
  { id: "n4", en: "Four", es: "Cuatro", value: 4, digit: "4" },
  { id: "n5", en: "Five", es: "Cinco", value: 5, digit: "5" },
];

export const FEED_PAIRS: FeedPair[] = [
  {
    id: "bunny",
    animal: { en: "Bunny", es: "Conejito", emoji: "🐰" },
    food: { en: "Carrot", es: "Zanahoria", emoji: "🥕" },
  },
  {
    id: "puppy",
    animal: { en: "Puppy", es: "Perrito", emoji: "🐶" },
    food: { en: "Treat", es: "Premio", emoji: "🦴" },
  },
  {
    id: "cat",
    animal: { en: "Cat", es: "Gatito", emoji: "🐱" },
    food: { en: "Fish", es: "Pescado", emoji: "🐟" },
  },
  {
    id: "bird",
    animal: { en: "Bird", es: "Pajarito", emoji: "🐦" },
    food: { en: "Seeds", es: "Semillas", emoji: "🌾" },
  },
  {
    id: "frog",
    animal: { en: "Frog", es: "Ranita", emoji: "🐸" },
    food: { en: "Fly", es: "Mosca", emoji: "🪰" },
  },
  {
    id: "bee",
    animal: { en: "Bee", es: "Abejita", emoji: "🐝" },
    food: { en: "Flower", es: "Flor", emoji: "🌼" },
  },
];

export const MOVEMENTS: MovementItem[] = [
  { id: "clap", en: "Clap", es: "Aplaude", emoji: "👏", cue: "clap" },
  { id: "stomp", en: "Stomp", es: "Pisa fuerte", emoji: "🦶", cue: "stomp" },
  { id: "spin", en: "Spin", es: "Da una vuelta", emoji: "💫", cue: "spin" },
  { id: "jump", en: "Jump", es: "Salta", emoji: "⬆️", cue: "jump" },
  { id: "wiggle", en: "Wiggle", es: "Muévete", emoji: "〰️", cue: "wiggle" },
  { id: "freeze", en: "Freeze", es: "Quédate quieta", emoji: "❄️", cue: "freeze" },
];

export const ACTIVITIES: {
  id: ActivityId;
  emoji: string;
  en: string;
  es: string;
  blurbEn: string;
  blurbEs: string;
  scene: string;
  rounds: number;
}[] = [
  {
    id: "colors",
    emoji: "🌈",
    en: "Color Garden",
    es: "Jardín de Colores",
    blurbEn: "Match pretty colors",
    blurbEs: "Une los colores",
    scene: "flower",
    rounds: 6,
  },
  {
    id: "animals",
    emoji: "🐾",
    en: "Animal Friends",
    es: "Amigos Animales",
    blurbEn: "Find the animals",
    blurbEs: "Encuentra los animales",
    scene: "woodland",
    rounds: 6,
  },
  {
    id: "shapes",
    emoji: "⭐",
    en: "Shape Meadow",
    es: "Prado de Formas",
    blurbEn: "Match the shapes",
    blurbEs: "Une las formas",
    scene: "meadow",
    rounds: 6,
  },
  {
    id: "counting",
    emoji: "🐸",
    en: "Counting Pond",
    es: "Estanque de Contar",
    blurbEn: "Count 1 to 5",
    blurbEs: "Cuenta del 1 al 5",
    scene: "pond",
    rounds: 5,
  },
  {
    id: "feed",
    emoji: "🧺",
    en: "Feed the Friends",
    es: "Alimenta a los Amigos",
    blurbEn: "Give them a snack",
    blurbEs: "Dales un refrigerio",
    scene: "picnic",
    rounds: 6,
  },
  {
    id: "music",
    emoji: "🎵",
    en: "Music and Movement",
    es: "Música y Movimiento",
    blurbEn: "Move and play",
    blurbEs: "Muévete y juega",
    scene: "stage",
    rounds: 6,
  },
];

export const COUNT_OBJECTS = ["🐸", "🌸", "🦆", "🦋", "🫐"] as const;
