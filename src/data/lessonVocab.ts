/**
 * Word lists for lessons. Everything here is original or plain vocabulary;
 * tests check that each lesson only uses keys it has taught by then.
 */

/** Cute and themed words. Letter lessons use the ones she can already type. */
export const themedVocab = `a ad as add ask dad fad lad sad all fall glad flask salad alfalfa gala jade
has had half hash flash shall dash shh lash
she sea see seed feel feed fee field side slide like likes hike lake sake ideal idea deal kiss kisses
her his hug hugs sure dear real red read ride rise rush sugar fresh share shared dish dishes hear heard
sushi ruler guard
date dates tea treat story stories sweet sweetie yay hey kitty pretty tired starry diary tight
you your love lovely loved wow two together forever always word world dream dreams flower flowers rose
roses star stars stay heart hearts sweater weekend party wish wishes rooftop happy
pink peach drama dramas movie movies episode season scene smile smiles umbrella music song songs
cozy cute cutie cuddle dance dancing date coffee chocolate cake rice curry spicy mochi matcha miso
ramen salmon tuna gyoza udon soba katsu naan dosa chai lassi samosa paneer biryani mango masala tikka
brunch shoes dress outfit glitter selfie friends night lights karaoke
laptop meeting email deck slides teams call sync update report desk office project deadline launch
family kids baby babe honey darling adore blush sigh laugh laughs rain sunshine dinner zoo lazy`.split(/\s+/);

export const patternWords = {
  th: `the they them then there these this that with other mother father brother together weather thing things
think thank thanks three both north south health theater athlete rhythm whether bath teeth mouth`.split(/\s+/),
  inAnErRe: `in an and any many plan plans dinner winter sister answer under never ever every here there where more
before after great free tree pretty dream ring wine kind train dancer prince princess rain reread`.split(/\s+/),
  endings: `dancing eating singing laughing dreaming watching cooking texting shopping smiling loved missed asked
kissed danced cooked baked started ended finally really truly sweetly slowly softly lovely likely only early`.split(/\s+/),
  clusters: `you your our out about house would could should young touch sea tea eat each dream heart near peach beach
first best still star story stay start fast chai lunch much such chicken chef cheese teach coach`.split(/\s+/),
};

export const symbolWords = {
  smile: ['yay!', 'wow!', 'omg!', 'hi!', ':)', ':(', ':D', '(soon)', '(again)', '(maybe)', 'note:', 'time:', 'yes!', 'finally!', '(sigh)', 'cute!', 'ugh!', 'love:'],
  tags: ['@home', '@work', '@noon', '#tbt', '#foodie', '#datenight', '#kdrama', '#mood', '#1', 'k-drama', 'c-drama', 'well-done', 're-watch', 'self-care', 'to-do', 'sing-along', 'first_name', 'my_notes'],
  money: ['$12', '$5.50', '$30', '50%', '100%', '20%', 'R&B', 'Q&A', 'M&Ms', '*wink*', '*sigh*', '2+2=4', '1+1=2', 'x=5', 'a+b', '10%', '$99', '5*'],
  brackets: ['"yes"', '"no"', '"okay"', '"forever"', '<3', '<3<3', '[draft]', '[done]', '[x]', '[tbc]', 'and/or', 'a/b', '->', '<-', '>_<', '[1]', '"wow"', '[note]'],
};

/** The most common English words, for the speed lessons. */
export const top50 = `the be to of and a in that have it for not on with he as you do at this but his by from they we say her
she or an will my one all would there their what so up out if about who get which go me is`.split(/\s+/);

export const next50 = `when make can like time no just him know take people into year your good some could them see other than then
now look only come its over think also back after use two how our work first well way even new want because
any these give day most us`.split(/\s+/);

/** Words typed with strictly alternating hands, which research links to a faster, steadier rhythm. */
export const alternatingWords = `the and for wish turn both girl city make when them also right sign hand lens half
sight work form body pay men did end fix rich island problem eight social auto chair panel title
blame dish cozy flair fuel lamb than they`.split(/\s+/);
