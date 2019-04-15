const projectId = 'propane-will-234405';
const keyFilename = '/Users/audrey/Desktop/gong/speech/speechkey_origin.json';

const {
  Translate
} = require('@google-cloud/translate');
// Creates a client
const translate = new Translate({
  projectId,
  keyFilename,
});

const targets = ['ja','en']
let text = '일단 긴 글이니 인내심 가지고 읽어주세요)안녕하세요. 지금 중2학년인데요.요즘에 학업 스트레스보다 아빠관계?에 관한 스트레스가너무 심해서 상담도 받아보고 싶고 정말 죽고싶었던생각도 많이 들었었는데요. 아빠가 맨날 ㅅㅂ,ㅂㅅ아,에휴 하는게 없냐 이러시는데요 맨날 새끼라고는하시는데 그건 이제 충북사람이니깐 어쩔 수 없다생각했는데 날이 갈수록 심각해지네요.같이 얘기할려고 해도 맨날 몽둥이로 위협을가하니 뭘 할수가 없더라고요. 이젠 부모생각도 포기했습니다. 새부모란 다 이런건가요? 드라마나 현실이나다를게 없다 느껴졌습니다. 해결법을 알려달라고는안 하겠습니다. 스트레스 완화법이나 특별하게스트레스를 날려버릴수 있다. 싶은 방법들을 알려주세요(허나 부모나 가족은 빼고 개인적이거나 친구들2~3명? 정도로 제가 친구가 없어서요. 부탁드리겠습니다. 긴 글 읽어주셔서 감사합니다.)';

let translations = async function processArray(array, text) {
  let str='';
  for (const target of array) {
    let [translations] = await translate.translate(text, target);
    translations = Array.isArray(translations) ? translations : [translations];
    str+=translations;
  }
  return str;
}

// processArray(targets,text);
translations(targets,text).then(function(result){
  console.log(result);
});
