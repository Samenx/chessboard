const ar = {
  'Courses':'الدورات','My Library':'مكتبتي','Study':'تعلّم','Practice':'تدريب','Admin studio':'استوديو الإدارة',
  'Search courses':'ابحث عن الدورات','Sign in':'تسجيل الدخول','Sign up':'إنشاء حساب','Explore the bookstore':'استكشف الدورات',
  'Go to my library':'انتقل إلى مكتبتي','Create a free account':'أنشئ حسابًا مجانيًا','Better chess starts':'تبدأ الشطرنج الأفضل',
  'with understanding.':'بالفهم.','Study ideas from great players, explore every move on the board, and build a chess library that stays with you.':'تعلّم أفكار كبار اللاعبين، واستكشف النقلات على الرقعة، وابنِ مكتبة شطرنج ترافقك.',
  'Books built to be studied':'كتب صُممت للتعلّم','Clear chapters and lessons, each paired with the position.':'فصول ودروس واضحة مرتبطة بالموقف على الرقعة.','Learn by doing':'تعلّم بالممارسة',
  'Play through lines, train your recall, and review what you’ve learned.':'تابع الخطوط، ودرّب ذاكرتك، وراجع ما تعلّمته.','Your personal library':'مكتبتك الشخصية','Keep the books you own together with your learning progress.':'اجمع كتبك وتقدّمك في مكان واحد.',
  'Choose your next study':'اختر درسك التالي','Browse all courses':'تصفّح جميع الدورات','Start building your chess library.':'ابدأ ببناء مكتبة الشطرنج الخاصة بك.','Open my library':'افتح مكتبتي',
  'Welcome back to the board.':'مرحبًا بعودتك إلى الرقعة.','Your books, your lines, your next idea.':'كتبك وخطوطك وفكرتك التالية.','Continue learning from your personal chess library.':'تابع التعلّم من مكتبة الشطرنج الخاصة بك.',
  'Email address':'البريد الإلكتروني','Password':'كلمة المرور','Your password':'كلمة المرور','New to Chess Arena?':'جديد في Chess Arena؟','Create an account':'إنشاء حساب','Back to home':'العودة للرئيسية',
  'Make room for a better move.':'افسح المجال لنقلة أفضل.','Sign up to keep your chess books and learning in one place.':'أنشئ حسابًا لتجمع كتب الشطرنج وتعلّمك في مكان واحد.','Your name':'اسمك','Name':'الاسم','At least 8 characters':'٨ أحرف على الأقل',
  'Already have an account?':'لديك حساب بالفعل؟','Account settings':'إعدادات الحساب','Sign out':'تسجيل الخروج','Shopping cart':'سلة التسوق','Your cart is empty':'سلتك فارغة','Order summary':'ملخص الطلب',
  'My library':'مكتبتي','Pick up where you left off, or review a line you have learned.':'تابع من حيث توقفت، أو راجع خطًا تعلّمته.','Practice saved lines':'تدرّب على الخطوط المحفوظة','Start learning':'ابدأ التعلّم','Continue learning':'تابع التعلّم',
  'Mark lesson complete':'أكمل الدرس','Lesson complete':'اكتمل الدرس','Previous':'السابق','Next lesson':'الدرس التالي','Finish course':'إنهاء الدورة','Previous sector':'القسم السابق','Next sector':'القسم التالي','Flip board':'اقلب الرقعة','Review line':'راجع الخط',
  'Start from beginning':'ابدأ من البداية','Browse the store':'تصفّح المتجر','Course at a glance':'لمحة عن الدورة','Course contents':'محتويات الدورة','About this course':'عن هذه الدورة','Course language':'لغة الدورة','English':'الإنجليزية','Arabic':'العربية','Your progress':'تقدّمك','Continue studying':'تابع التعلّم','Chapter':'الفصل','lessons':'دروس','Lesson':'الدرس',
  'Paid checkout is currently unavailable.':'الدفع للدورات المدفوعة غير متاح حاليًا.','Paid checkout is unavailable until a payment provider is configured. Your cart is saved.':'الدفع غير متاح حتى إعداد مزوّد دفع. ستبقى سلتك محفوظة.','No payment was taken and no courses were added to your library.':'لم يتم تحصيل أي مبلغ ولم تتم إضافة دورات إلى مكتبتك.','Checkout unavailable':'إتمام الشراء غير متاح','Back to cart':'العودة إلى السلة',
  'Page':'الصفحة','of':'من','Lesson pages':'صفحات الدرس','Previous page':'الصفحة السابقة','Next page':'الصفحة التالية','Exercise completed':'اكتمل التمرين','Your cart':'سلة التسوق'
};

export function translate(value, language='en') {
  return language === 'ar' ? (ar[value] || value) : value;
}

export function directionFor(language) {
  return language === 'ar' ? 'rtl' : 'ltr';
}
