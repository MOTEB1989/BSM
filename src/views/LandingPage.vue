<template>
  <div class="bg-[#0B0E11] text-white min-h-screen">
    <!-- Hero -->
    <section class="relative overflow-hidden">
      <div class="absolute inset-0 pointer-events-none">
        <div class="w-full h-full bg-grid-pattern opacity-20"></div>
        <div class="absolute inset-0 bg-gradient-to-b from-transparent to-[rgba(10,132,255,0.02)]"></div>
      </div>

      <div class="container mx-auto px-6 py-20 relative z-10">
        <div class="flex flex-col lg:flex-row items-center gap-12">
          <div class="w-full lg:w-1/2">
            <h1 class="text-4xl lg:text-5xl font-extrabold leading-tight mb-4">
              ضابط الموقع
              <span class="block text-[#00C8FF] mt-2 text-2xl font-semibold">العقل المركزي لمنصات الذكاء الاصطناعي</span>
            </h1>

            <p class="text-slate-300 text-lg mb-6 max-w-xl">
              منصة متقدمة تجمع بين قوة النماذج، تنسيق الوكلاء، واسترجاع المعرفة لتقديم قرارات ذكية وآمنة.
            </p>

            <div class="flex gap-4">
              <button
                class="bg-[#0A84FF] hover:bg-[#0077e6] px-6 py-3 rounded-lg font-semibold shadow-neon transition"
                @click="onStart"
              >
                ابدأ الآن
              </button>

              <button
                class="border border-[#0A84FF] text-[#0A84FF] px-6 py-3 rounded-lg bg-transparent hover:bg-[rgba(10,132,255,0.04)] transition"
                @click="scrollToSection('learn')"
              >
                تعرّف أكثر
              </button>
            </div>

            <div class="mt-8 grid grid-cols-2 gap-4 max-w-md">
              <div class="p-4 rounded-lg bg-[rgba(255,255,255,0.02)] border border-transparent hover:border-[#0A84FF] transition">
                <h4 class="text-sm text-slate-200 font-semibold">ذكاء متعدد النماذج</h4>
                <p class="text-xs text-slate-400">اختيار النموذج الأمثل لكل مهمة.</p>
              </div>
              <div class="p-4 rounded-lg bg-[rgba(255,255,255,0.02)] border border-transparent hover:border-[#0A84FF] transition">
                <h4 class="text-sm text-slate-200 font-semibold">تنسيق الوكلاء</h4>
                <p class="text-xs text-slate-400">توزيع ذكي يقلل الأخطاء ويزيد الكفاءة.</p>
              </div>
            </div>
          </div>

          <div class="w-full lg:w-1/2 flex justify-center">
            <div class="relative w-full max-w-md">
              <div
                class="hero-visual w-full h-80 bg-center bg-no-repeat bg-contain rounded-xl shadow-neon"
                :style="{ backgroundImage: `url(${heroImage})` }"
                aria-hidden="true"
              ></div>
              <div class="absolute -inset-2 rounded-xl pointer-events-none animate-slow-pulse"></div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Why Different -->
    <section id="learn" class="py-16 bg-transparent text-white">
      <div class="container mx-auto px-6">
        <h2 class="text-2xl font-bold mb-6">لماذا هو مختلف؟</h2>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div class="p-6 rounded-xl bg-[rgba(255,255,255,0.02)] border border-transparent hover:border-[#0A84FF] transition shadow-neon">
            <div class="flex items-center gap-4 mb-3">
              <img src="/assets/icon-model.svg" alt="model" class="w-10 h-10"/>
              <h3 class="text-lg font-semibold">ذكاء متعدد النماذج</h3>
            </div>
            <p class="text-slate-300 text-sm">نختار النموذج الأمثل لكل مهمة بناءً على الأداء والتكلفة والدقة.</p>
          </div>

          <div class="p-6 rounded-xl bg-[rgba(255,255,255,0.02)] border border-transparent hover:border-[#0A84FF] transition shadow-neon">
            <div class="flex items-center gap-4 mb-3">
              <img src="/assets/icon-agents.svg" alt="agents" class="w-10 h-10"/>
              <h3 class="text-lg font-semibold">تنسيق تلقائي للوكلاء</h3>
            </div>
            <p class="text-slate-300 text-sm">توزيع ذكي للمهام بين وكلاء متخصصين لتقليل الأخطاء وتسريع النتائج.</p>
          </div>

          <div class="p-6 rounded-xl bg-[rgba(255,255,255,0.02)] border border-transparent hover:border-[#0A84FF] transition shadow-neon">
            <div class="flex items-center gap-4 mb-3">
              <img src="/assets/icon-knowledge.svg" alt="knowledge" class="w-10 h-10"/>
              <h3 class="text-lg font-semibold">معرفة متصلة</h3>
            </div>
            <p class="text-slate-300 text-sm">RAG دقيق مع تتبّع مصدر المعلومات لضمان الموثوقية والقابلية للتدقيق.</p>
          </div>
        </div>
      </div>
    </section>

    <!-- How It Works -->
    <section class="py-16">
      <div class="container mx-auto px-6 text-white">
        <h2 class="text-2xl font-bold mb-8">كيف يعمل ضابط الموقع؟</h2>
        <div class="flex flex-col md:flex-row items-start gap-8">
          <ol class="flex-1 space-y-6">
            <li v-for="(step, i) in steps" :key="i" class="step p-4 rounded-lg bg-[rgba(255,255,255,0.02)] transition transform">
              <div class="flex items-start gap-4">
                <div class="w-12 h-12 rounded-full flex items-center justify-center bg-[#071025] border border-[#0A84FF] text-[#0A84FF] font-bold">
                  {{ i + 1 }}
                </div>
                <div>
                  <h4 class="font-semibold">{{ step.title }}</h4>
                  <p class="text-slate-300 text-sm">{{ step.desc }}</p>
                </div>
              </div>
            </li>
          </ol>

          <div class="w-full md:w-1/3 p-6 rounded-xl bg-[rgba(255,255,255,0.02)] border border-transparent shadow-neon">
            <h4 class="font-semibold mb-3">المخطط البصري</h4>
            <p class="text-slate-300 text-sm">تحليل → اختيار وكيل → اختيار نموذج → استرجاع → تنفيذ → رد</p>
            <div class="mt-4 h-40 flex items-center justify-center text-slate-400">[مخطط توضيحي]</div>
          </div>
        </div>
      </div>
    </section>

    <!-- Use Cases -->
    <section class="py-16 bg-transparent text-white">
      <div class="container mx-auto px-6">
        <h2 class="text-2xl font-bold mb-6">ماذا يمكنك أن تفعل؟</h2>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div v-for="(c, i) in cases" :key="i" class="p-5 rounded-xl bg-[rgba(255,255,255,0.02)] hover:shadow-neon transition transform hover:-translate-y-2">
            <div class="flex items-center gap-3 mb-3">
              <img :src="c.icon" alt="" class="w-8 h-8"/>
              <h4 class="font-semibold">{{ c.title }}</h4>
            </div>
            <p class="text-slate-300 text-sm">{{ c.desc }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- Security Panel -->
    <section class="py-16">
      <div class="container mx-auto px-6 text-white">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
          <div class="md:col-span-2 p-6 rounded-xl bg-[rgba(255,255,255,0.02)] border border-transparent hover:border-[#0A84FF]">
            <h3 class="text-xl font-semibold mb-3">أمان سيبراني على مستوى المؤسسات</h3>
            <ul class="space-y-3 text-slate-300">
              <li>• تشفير بيانات شامل (AES-256/TLS)</li>
              <li>• إدارة مفاتيح مركزية وآمنة</li>
              <li>• سياسات وصول دقيقة وصلاحيات قابلة للتخصيص</li>
              <li>• مراقبة لحظية وكشف تهديدات مبكر</li>
            </ul>
          </div>

          <div class="p-6 rounded-xl bg-[rgba(255,255,255,0.02)] flex flex-col items-center justify-center shadow-neon">
            <img src="/assets/icon-shield.svg" alt="shield" class="w-24 h-24 mb-4"/>
            <div class="text-slate-200 font-semibold">الحماية مفعّلة</div>
            <div class="text-slate-400 text-sm mt-2">مراقبة، تشفير، وسياسات صارمة</div>
          </div>
        </div>
      </div>
    </section>

    <!-- Footer CTA -->
    <footer class="bg-[#071025] text-white py-12">
      <div class="container mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
        <div>
          <h4 class="text-xl font-bold">ابدأ رحلتك مع ضابط الموقع</h4>
          <p class="text-slate-300 text-sm">انضم الآن وجرب قوة التنسيق الذكي بين الوكلاء والنماذج.</p>
        </div>

        <div class="flex gap-4">
          <button class="bg-[#0A84FF] px-5 py-3 rounded-lg font-semibold" @click="onStart">ابدأ الآن</button>
          <a class="px-5 py-3 rounded-lg border border-[#2b3b4a] text-slate-300" href="/contact">تواصل معنا</a>
        </div>
      </div>
    </footer>
  </div>
</template>

<script>
export default {
  name: 'LandingPage',
  data() {
    return {
      heroImage: '/assets/hero-head.webp',
      stepObserver: null,
      steps: [
        { title: 'تحليل الطلب', desc: 'فهم نية المستخدم وتحديد نوع المهمة.' },
        { title: 'اختيار الوكيل', desc: 'تحديد الوكيل المتخصص الأنسب.' },
        { title: 'اختيار النموذج', desc: 'اختيار النموذج الأفضل من حيث دقة وتكلفة.' },
        { title: 'استرجاع المعرفة', desc: 'استدعاء مصادر RAG ذات الصلة.' },
        { title: 'تنفيذ المهمة', desc: 'تنفيذ المهمة عبر الوكيل والنموذج المختار.' },
        { title: 'إرجاع النتيجة', desc: 'تقديم إجابة موثوقة مع تتبع المصدر.' }
      ],
      cases: [
        { icon: '/assets/icon-legal.svg', title: 'تحليل قانوني', desc: 'مراجعة عقود، استخراج نقاط قانونية، وصياغة مذكرات.' },
        { icon: '/assets/icon-research.svg', title: 'بحث علمي', desc: 'تلخيص أوراق، اقتراح تجارب، وتجهيز مراجع.' },
        { icon: '/assets/icon-content.svg', title: 'كتابة محتوى', desc: 'مقالات، منشورات، ونصوص تسويقية.' },
        { icon: '/assets/icon-data.svg', title: 'تحليل بيانات', desc: 'استكشاف بيانات، نمذجة، وتصورات.' },
        { icon: '/assets/icon-support.svg', title: 'دعم فني', desc: 'تشخيص مشاكل، اقتراح حلول، وإرشاد المستخدم.' },
        { icon: '/assets/icon-biz.svg', title: 'ذكاء أعمال', desc: 'تقارير، مؤشرات أداء، وتوصيات استراتيجية.' },
        { icon: '/assets/icon-project.svg', title: 'إدارة مشاريع', desc: 'تخطيط، تتبع، وتوليد تقارير حالة.' },
        { icon: '/assets/icon-consult.svg', title: 'استشارات تقنية', desc: 'تصميم حلول، تقييم بنية، وتخطيط نشر.' }
      ]
    };
  },
  mounted() {
    this.stepObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) entry.target.classList.add('glow-on');
      });
    }, { threshold: 0.2 });

    this.$nextTick(() => {
      document.querySelectorAll('.step').forEach((el) => this.stepObserver.observe(el));
    });
  },
  beforeUnmount() {
    if (this.stepObserver) {
      this.stepObserver.disconnect();
      this.stepObserver = null;
    }
  },
  methods: {
    onStart() {
      // placeholder: افتح modal أو توجه للتسجيل
      alert('ابدأ الآن — (نموذج تجريبي)');
    },
    scrollToSection(id) {
      const el = document.getElementById(id);
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }
  }
};
</script>

<style scoped>
/* Grid background */
.bg-grid-pattern {
  background-image: linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px);
  background-size: 60px 60px, 60px 60px;
  transform: translateZ(0);
}

/* Hero visual */
.hero-visual {
  background-repeat: no-repeat;
  background-position: center;
  background-size: contain;
}

/* Shadows & neon */
.shadow-neon { box-shadow: 0 10px 40px rgba(10,132,255,0.12), 0 2px 8px rgba(10,132,255,0.06); }

/* Slow pulse animation */
@keyframes slowPulse {
  0% { box-shadow: 0 0 0 0 rgba(10,132,255,0.06); }
  70% { box-shadow: 0 0 60px 20px rgba(10,132,255,0.02); }
  100% { box-shadow: 0 0 0 0 rgba(10,132,255,0.00); }
}
.animate-slow-pulse { animation: slowPulse 6s infinite ease-in-out; }

/* Step glow */
.step { transition: box-shadow .45s, transform .45s; }
.step.glow-on { box-shadow: 0 12px 40px rgba(10,132,255,0.12); transform: translateY(-6px); }

/* Hover neon for cards */
.hover\:shadow-neon:hover { box-shadow: 0 12px 40px rgba(10,132,255,0.10); }

/* Responsive tweaks */
@media (max-width: 768px) {
  .hero-visual { height: 320px; }
}
</style>
