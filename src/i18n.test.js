import test from 'node:test';
import assert from 'node:assert/strict';
import { directionFor, translate } from './i18n.js';

test('English is the default and unknown authored copy stays intact', () => {
  assert.equal(translate('Courses'), 'Courses');
  assert.equal(translate('An instructor supplied title'), 'An instructor supplied title');
});

test('Arabic translates core navigation and declares RTL direction', () => {
  assert.equal(translate('Courses', 'ar'), '\u0627\u0644\u062f\u0648\u0631\u0627\u062a');
  assert.equal(translate('White to move', 'ar'), '\u0627\u0644\u0623\u0628\u064a\u0636 \u064a\u0644\u0639\u0628');
  assert.equal(translate('Restart exercise', 'ar'), '\u0623\u0639\u062f \u0627\u0644\u062a\u0645\u0631\u064a\u0646');
  assert.equal(translate('Courses', 'ar'), 'الدورات');
  assert.equal(translate('Mark lesson complete', 'ar'), 'أكمل الدرس');
  assert.equal(translate('Course language', 'ar'), 'لغة الدورة');
  assert.equal(translate('Course contents', 'ar'), 'محتويات الدورة');
  assert.equal(translate('Paid checkout is currently unavailable.', 'ar'), 'الدفع للدورات المدفوعة غير متاح حاليًا.');
  assert.equal(translate('Next page', 'ar'), 'الصفحة التالية');
  assert.equal(translate('English', 'ar'), 'الإنجليزية');
  assert.equal(directionFor('ar'), 'rtl');
  assert.equal(directionFor('en'), 'ltr');
});
