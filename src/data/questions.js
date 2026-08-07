export const categories = [
  {
    id: 'math',
    name: 'Mathematics',
    emoji: '📐',
    description: 'Numbers, algebra and problem solving',
    accent: '#6366f1',
    questions: [
      {
        question: 'What is the value of 12 × 8?',
        options: ['84', '96', '108', '88'],
        answer: 1,
      },
      {
        question: 'What is the square root of 144?',
        options: ['11', '13', '12', '14'],
        answer: 2,
      },
      {
        question: 'If x + 7 = 15, what is x?',
        options: ['7', '8', '9', '6'],
        answer: 1,
      },
      {
        question: 'What is 15% of 200?',
        options: ['25', '30', '20', '35'],
        answer: 1,
      },
      {
        question: 'What is the area of a triangle with base 6 and height 8?',
        options: ['48', '24', '28', '36'],
        answer: 1,
      },
      {
        question: 'What is the value of 2⁵ (2 to the power of 5)?',
        options: ['16', '64', '32', '25'],
        answer: 2,
      },
      {
        question: 'What is the next number in the sequence: 2, 4, 8, 16, ...?',
        options: ['20', '24', '32', '30'],
        answer: 2,
      },
      {
        question: 'What is 7/8 as a decimal?',
        options: ['0.75', '0.875', '0.85', '0.825'],
        answer: 1,
      },
      {
        question: 'What is the greatest common divisor (GCD) of 24 and 36?',
        options: ['6', '8', '12', '18'],
        answer: 2,
      },
      {
        question: 'Solve: 3(x - 2) = 9. What is x?',
        options: ['3', '4', '5', '6'],
        answer: 2,
      },
    ],
  },
  {
    id: 'science',
    name: 'Science',
    emoji: '🔬',
    description: 'Biology, chemistry and physics',
    accent: '#10b981',
    questions: [
      {
        question: 'What is the chemical symbol for water?',
        options: ['H2O', 'CO2', 'NaCl', 'O2'],
        answer: 0,
      },
      {
        question: 'What planet is known as the Red Planet?',
        options: ['Venus', 'Mars', 'Jupiter', 'Saturn'],
        answer: 1,
      },
      {
        question: 'What is the powerhouse of the cell?',
        options: ['Nucleus', 'Ribosome', 'Mitochondria', 'Chloroplast'],
        answer: 2,
      },
      {
        question: 'What gas do plants absorb from the atmosphere?',
        options: ['Oxygen', 'Nitrogen', 'Carbon dioxide', 'Hydrogen'],
        answer: 2,
      },
      {
        question: 'What is the speed of light approximately?',
        options: ['300,000 km/s', '150,000 km/s', '1,000,000 km/s', '100,000 km/s'],
        answer: 0,
      },
      {
        question: 'What is the atomic number of carbon?',
        options: ['4', '6', '8', '12'],
        answer: 1,
      },
      {
        question: 'Which organ pumps blood around the body?',
        options: ['Lungs', 'Brain', 'Liver', 'Heart'],
        answer: 3,
      },
      {
        question: 'What is the most abundant gas in Earth\'s atmosphere?',
        options: ['Oxygen', 'Nitrogen', 'Argon', 'Carbon dioxide'],
        answer: 1,
      },
      {
        question: 'What is the force that pulls objects toward the Earth?',
        options: ['Magnetism', 'Friction', 'Gravity', 'Inertia'],
        answer: 2,
      },
      {
        question: 'Which of these is NOT a state of matter?',
        options: ['Solid', 'Liquid', 'Energy', 'Gas'],
        answer: 2,
      },
    ],
  },
  {
    id: 'history',
    name: 'History',
    emoji: '🏛️',
    description: 'World events and famous figures',
    accent: '#f59e0b',
    questions: [
      {
        question: 'Who was the first President of the United States?',
        options: ['Thomas Jefferson', 'Abraham Lincoln', 'George Washington', 'John Adams'],
        answer: 2,
      },
      {
        question: 'In which year did World War II end?',
        options: ['1943', '1944', '1945', '1946'],
        answer: 2,
      },
      {
        question: 'The Great Wall is located in which country?',
        options: ['Japan', 'China', 'India', 'Korea'],
        answer: 1,
      },
      {
        question: 'Who painted the Mona Lisa?',
        options: ['Michelangelo', 'Vincent van Gogh', 'Pablo Picasso', 'Leonardo da Vinci'],
        answer: 3,
      },
      {
        question: 'Which ancient civilization built the pyramids of Giza?',
        options: ['Romans', 'Greeks', 'Egyptians', 'Persians'],
        answer: 2,
      },
      {
        question: 'Who was the first man to walk on the Moon?',
        options: ['Buzz Aldrin', 'Neil Armstrong', 'Michael Collins', 'Yuri Gagarin'],
        answer: 1,
      },
      {
        question: 'The Berlin Wall fell in which year?',
        options: ['1987', '1988', '1989', '1990'],
        answer: 2,
      },
      {
        question: 'Which empire was ruled by Julius Caesar?',
        options: ['Greek Empire', 'Roman Empire', 'Ottoman Empire', 'British Empire'],
        answer: 1,
      },
      {
        question: 'In which country did the Industrial Revolution begin?',
        options: ['United States', 'France', 'Germany', 'United Kingdom'],
        answer: 3,
      },
      {
        question: 'Who discovered the structure of DNA in 1953?',
        options: ['Einstein & Newton', 'Watson & Crick', 'Darwin & Mendel', 'Curie & Bohr'],
        answer: 1,
      },
    ],
  },
  {
    id: 'geography',
    name: 'Geography',
    emoji: '🌍',
    description: 'Countries, capitals and landmarks',
    accent: '#06b6d4',
    questions: [
      {
        question: 'What is the capital of France?',
        options: ['London', 'Berlin', 'Paris', 'Madrid'],
        answer: 2,
      },
      {
        question: 'What is the largest ocean on Earth?',
        options: ['Atlantic', 'Indian', 'Arctic', 'Pacific'],
        answer: 3,
      },
      {
        question: 'Which is the longest river in the world?',
        options: ['Amazon', 'Nile', 'Yangtze', 'Mississippi'],
        answer: 1,
      },
      {
        question: 'Mount Everest is located in which mountain range?',
        options: ['Andes', 'Alps', 'Himalayas', 'Rockies'],
        answer: 2,
      },
      {
        question: 'What is the largest continent by area?',
        options: ['Africa', 'North America', 'Europe', 'Asia'],
        answer: 3,
      },
      {
        question: 'What is the capital of Japan?',
        options: ['Beijing', 'Seoul', 'Tokyo', 'Bangkok'],
        answer: 2,
      },
      {
        question: 'Which country is shaped like a boot?',
        options: ['Spain', 'Greece', 'Portugal', 'Italy'],
        answer: 3,
      },
      {
        question: 'The Sahara is the largest what in the world?',
        options: ['Forest', 'Hot desert', 'Lake', 'Mountain range'],
        answer: 1,
      },
      {
        question: 'What is the smallest country in the world?',
        options: ['Monaco', 'Vatican City', 'Malta', 'San Marino'],
        answer: 1,
      },
      {
        question: 'Which river flows through Cairo?',
        options: ['Tigris', 'Euphrates', 'Nile', 'Niger'],
        answer: 2,
      },
    ],
  },
  {
    id: 'english',
    name: 'English',
    emoji: '📚',
    description: 'Grammar, vocabulary and literature',
    accent: '#ec4899',
    questions: [
      {
        question: 'Choose the correct sentence:',
        options: [
          'She don\'t like apples',
          'She doesn\'t likes apples',
          'She doesn\'t like apples',
          'She not like apples',
        ],
        answer: 2,
      },
      {
        question: 'What is a synonym for "happy"?',
        options: ['Sad', 'Angry', 'Joyful', 'Tired'],
        answer: 2,
      },
      {
        question: 'Which word is a noun?',
        options: ['Quickly', 'Beautiful', 'Happiness', 'Run'],
        answer: 2,
      },
      {
        question: 'Who wrote "Romeo and Juliet"?',
        options: ['Charles Dickens', 'William Shakespeare', 'Jane Austen', 'Mark Twain'],
        answer: 1,
      },
      {
        question: 'What is the past tense of "go"?',
        options: ['Goed', 'Gone', 'Went', 'Going'],
        answer: 2,
      },
      {
        question: 'Which sentence is in the passive voice?',
        options: [
          'The dog bit the man',
          'The man was bitten by the dog',
          'The man bites the dog',
          'The dog is biting the man',
        ],
        answer: 1,
      },
      {
        question: 'What is the antonym of "ancient"?',
        options: ['Old', 'Modern', 'Antique', 'Historic'],
        answer: 1,
      },
      {
        question: 'How many letters are in the word "alphabet"?',
        options: ['7', '8', '9', '10'],
        answer: 1,
      },
      {
        question: 'Which is a correct plural form?',
        options: ['Childs', 'Children', 'Childrens', 'Childes'],
        answer: 1,
      },
      {
        question: 'What part of speech describes a verb?',
        options: ['Noun', 'Adjective', 'Adverb', 'Pronoun'],
        answer: 2,
      },
    ],
  },
]
