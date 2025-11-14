const fs = require('fs');
const vm = require('vm');

function loadTheatres(){
  const text = fs.readFileSync('index.html', 'utf8');
  const match = text.match(/var THEATRES = (\{[\s\S]*?\});/);
  if (!match) throw new Error('THEATRES data not found');
  return vm.runInNewContext('(' + match[1] + ')');
}

function loadSearchEngine(){
  const text = fs.readFileSync('index.html', 'utf8');
  const match = text.match(/\/\/ === BEGIN: Better fuzzy search \(list filtering\) ===([\s\S]*?)\/\/ === END: Better fuzzy search \(list filtering\) ===/);
  if (!match) throw new Error('Search script block not found');
  const context = { window: {}, console };
  vm.createContext(context);
  vm.runInContext(match[1], context);
  if (!context.window.RS || !context.window.RS.searchEngine) {
    throw new Error('Search engine did not initialize');
  }
  return context.window.RS.searchEngine;
}

function assert(condition, message){
  if (!condition) throw new Error(message);
}

function main(){
  const theatres = loadTheatres();
  const engine = loadSearchEngine();
  const records = theatres.features.map((feat, idx) => engine.recordFromProperties(feat.properties, idx));

  function namesFromResults(results){
    return results.map(entry => entry.record.source.name || entry.record.source.Theatre || '');
  }

  // City search
  const lakewoodResults = engine.searchRecords(records, 'Lakewood');
  console.log('Lakewood results:', namesFromResults(lakewoodResults));
  assert(lakewoodResults.length === 5, 'Expected 5 Lakewood theatres, got ' + lakewoodResults.length);
  lakewoodResults.forEach(result => {
    const addr = result.record.source.address || result.record.source.Address || '';
    assert(/Lakewood,\s*OH/i.test(addr), 'Non-Lakewood address found: ' + addr);
  });

  // Address search
  const addressQuery = '16407 Detroit Avenue';
  const addressResults = engine.searchRecords(records, addressQuery);
  console.log('Address results:', namesFromResults(addressResults));
  assert(addressResults.length > 0, 'Expected address query to return results');
  assert(/DETROIT/i.test(addressResults[0].record.source.name || ''), 'Top address result should be DETROIT theatre');

  // Movie search
  const movieQuery = 'Hangover Square';
  const movieResults = engine.searchRecords(records, movieQuery);
  console.log('Movie results:', namesFromResults(movieResults));
  assert(movieResults.length > 0, 'Expected movie query to return results');
  assert(/MALL/i.test(movieResults[0].record.source.name || ''), 'Top movie result should be MALL theatre');

  // Theatre name search
  const theatreQuery = "Loew's State";
  const theatreResults = engine.searchRecords(records, theatreQuery);
  console.log('Theatre name results:', namesFromResults(theatreResults));
  assert(theatreResults.length > 0, 'Expected theatre name query to return results');
  assert(/LOEW'S STATE/i.test(theatreResults[0].record.source.name || ''), 'Top theatre result should be LOEW\'S STATE');

  console.log('All search assertions passed.');
}

main();
