/**
 * Original themed text for the drills. Each list is filtered at run time to the
 * keys she has learned, so a sentence with ' or ? only shows up once those are taught.
 */

/** Cities, foods, days and made-up names that start with a capital. */
export const names = [
  'Seoul', 'Busan', 'Jeju', 'Tokyo', 'Kyoto', 'Osaka', 'Mumbai', 'Delhi', 'Goa', 'Jaipur',
  'Shanghai', 'Chengdu', 'Lagos', 'Abuja', 'Seattle', 'Redmond', 'Paris', 'London', 'Dubai', 'Bali',
  'Monday', 'Friday', 'Sunday', 'June', 'July', 'December', 'Ramen', 'Sushi', 'Biryani', 'Gyoza',
  'Tempura', 'Masala', 'Paneer', 'Dosa', 'Matcha', 'Mochi', 'Kimchi', 'Bibimbap', 'Dumplings', 'Chai',
  'Mina', 'Jiho', 'Hana', 'Kenji', 'Priya', 'Arjun', 'Lan', 'Wei', 'Yuna', 'Ravi',
  'Teams', 'Outlook', 'Excel', 'Windows', 'Azure',
];

/** Made-up drama, cafe and playlist titles in Title Case. */
export const titles = [
  'The Rooftop Promise', 'Midnight Ramen Club', 'Love In Seoul', 'My Secret Office Crush', 'The Lotus Pond',
  'Second Lead Syndrome', 'Rain On Our Umbrella', 'Spice Garden Kitchen', 'Moonlight Over Kyoto', 'The Plum Blossom Oath',
  'Friday Night Dinner', 'Sushi For Two', 'Chai And Rainy Days', 'The Last Episode', 'Our Family Table',
  'Dance Until Sunrise', 'Quick Sync Forever', 'Golden Hour Brunch', 'Butter Chicken Diaries', 'Lanterns Over The River',
];

/** Sentences with capitals and full stops only, so they work in the first Shift lessons. */
export const capitalSentences = [
  'Mina ran through the rain in Seoul.',
  'On Friday we ate ramen in a tiny shop in Tokyo.',
  'Jiho finally held her hand in episode sixteen.',
  'The second lead cried in a convenience store again.',
  'Priya ordered biryani, naan and a mango lassi.',
  'Her Teams call started at nine and ended at ten.',
  'We watched the lanterns float over the river in Chengdu.',
  'The chef in Osaka sliced tuna like it was art.',
  'Grandpa taught Dad how to send emojis on Sunday.',
  'She closed her laptop like the main character she is.',
  'Hana and Kenji shared one umbrella and no plan.',
  'Brunch turned into dinner, and dinner turned into dancing.',
  'The whole family kept the secret for four minutes.',
  'Matcha ice cream is not a dessert, it is a personality.',
  'We could not pick between dosa and paneer, so we got both.',
];

/** Apostrophe words, a mix of contractions and possessives. */
export const contractions = [
  "don't", "it's", "you're", "i'm", "we're", "can't", "that's", "let's", "she's", "isn't",
  "won't", "didn't", "he's", "they're", "we'll", "i'll", "you'll", "wasn't", "couldn't", "there's",
  "mom's", "chef's", "grandpa's", "Mina's", "Jiho's", "today's", "tonight's",
];

/** Short questions. */
export const questions = [
  'ready?', 'really?', 'sushi tonight?', 'ramen or dosa?', 'one more episode?', 'are you hungry?',
  'did he say it?', 'who is the second lead?', 'brunch on Sunday?', 'is this meeting an email?',
  'can we get dumplings?', 'why is it raining?', 'chai or coffee?', 'did you see the finale?',
  'where are we going?', 'what should I wear?',
];

/** Lists and stops for comma practice. */
export const commaPhrases = [
  'rain, ramen, romance.', 'naan, rice, raita.', 'sushi, miso, gyoza.', 'shoes, bag, keys, go.',
  'laptop, coffee, calls.', 'tea, samosas, a nap.', 'rooftop, music, stars.', 'chai, cake, cuddles.',
  'one, two, three, smile.', 'kimchi, rice, eggs.', 'dinner, dessert, dancing.', 'emails, lunch, more emails.',
];

/** Somebody said something. */
export const quoteSentences = [
  "He whispered, 'stay.'", "She said, 'one more episode.'", "Mom said, 'dinner is ready.'",
  "The chef said, 'trust me.'", "Grandpa said, 'what is an emoji?'", "Her boss said, 'great point.'",
  "Jiho said, 'I waited for you.'", "We both said, 'dumplings.'", "The waiter asked, 'spicy?'",
  "Priya laughed and said, 'obviously.'",
];

/** Sentences full of punctuation: commas, quotes, apostrophes and questions. */
export const punctuationSentences = [
  "Wait, did he really say 'I love you' in the rain?",
  "It's late, but one more episode can't hurt, right?",
  "She asked, 'ramen or biryani?' and we said, 'both.'",
  "Don't tell Mom, but we're planning a surprise party.",
  "Is it a quick sync, or is it a whole meeting again?",
  "The plum blossoms fell, and he still didn't say a word.",
  "We're going out tonight, so where are my cute shoes?",
  "Grandpa's phone beeped, and he asked, 'who is texting me?'",
  "That's the fourth time she's rewatched the finale, isn't it?",
  "If the gyoza is gone, who ate it? It wasn't me.",
];

/**
 * Sentences with numbers. `#` becomes a number made only from the digits she knows,
 * so the same sentence works in the 1 to 5 lesson and the 6 to 0 lesson.
 */
export const numberTemplates = [
  'We ordered # plates of gyoza and ate them in # minutes.',
  'Episode # ends on a cliffhanger, so we watched # more.',
  'Table for #, please, and # bowls of ramen.',
  'She had # meetings before lunch and # after.',
  'The samosas were # for #, which is a great deal.',
  'Only # days until our trip to Seoul.',
  'He waited # years by the lotus pond.',
  'Her playlist has # songs and she loves every one.',
  'The group chat sent # messages while we got ready.',
  'We walked # steps to find the best dumplings in town.',
];

/** Things to count. */
export const countables = [
  'dumplings', 'samosas', 'episodes', 'bowls', 'plates', 'naans', 'lattes', 'roses', 'songs', 'meetings',
  'tickets', 'hugs', 'kisses', 'stars', 'cakes', 'emails', 'friends', 'lanterns', 'umbrellas', 'cookies',
];
