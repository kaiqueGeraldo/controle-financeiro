/** Only the calendar is fixed; animation clocks and timers must remain native. */
async function setCivilDateOnly(page, date) {
  const time = date.getTime();
  if (!Number.isFinite(time)) throw new Error('Invalid fixed civil date');
  await page.addInitScript(fixedTime => {
    const NativeDate = Date;
    window.Date = new Proxy(NativeDate, {
      apply() { return new NativeDate(fixedTime).toString(); },
      construct(target, args, newTarget) {
        return Reflect.construct(target, args.length ? args : [fixedTime], newTarget);
      },
      get(target, key, receiver) {
        return key === 'now' ? () => fixedTime : Reflect.get(target, key, receiver);
      },
    });
  }, time);
}

module.exports = { setCivilDateOnly };
