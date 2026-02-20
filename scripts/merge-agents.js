#!/usr/bin/env node
import fs from 'fs/promises';
import YAML from 'yaml';
import { DuplicationDetector } from './prevent-duplicate-agents.js';

/**
 * دمج ذكي للـ Agents من مصادر متعددة
 * يتجنب التكرار ويحافظ على التكامل
 */

async function mergeAgents() {
  const mainRegistry = YAML.parse(
    await fs.readFile('agents/registry.yaml', 'utf8')
  );
  
  let secondaryRegistry;
  try {
    secondaryRegistry = YAML.parse(
      await fs.readFile('agents/registry-secondary.yaml', 'utf8')
    );
  } catch {
    console.log('⚠️  لا يوجد registry ثانوي للدمج');
    return;
  }
  
  const detector = new DuplicationDetector();
  const existingIds = new Set(mainRegistry.agents.map(a => a.id));
  let added = 0;
  
  for (const agent of secondaryRegistry.agents || []) {
    if (!existingIds.has(agent.id)) {
      // Check similarity before adding
      const wouldBeDuplicate = mainRegistry.agents.some(existing => {
        return detector.checkSimilarity(existing, agent) >= 70;
      });
      
      if (!wouldBeDuplicate) {
        mainRegistry.agents.push(agent);
        added++;
        console.log(`✅ أضيف: ${agent.id}`);
      } else {
        console.log(`⚠️  تم تجاهل (مشابه): ${agent.id}`);
      }
    }
  }
  
  await fs.writeFile(
    'agents/registry.yaml',
    YAML.stringify(mainRegistry)
  );
  
  console.log(`\n✅ تمت إضافة ${added} وكيل جديد`);
}

mergeAgents().catch(console.error);
