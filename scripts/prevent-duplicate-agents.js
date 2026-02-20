#!/usr/bin/env node
import fs from 'fs/promises';
import path from 'path';
import YAML from 'yaml';
import crypto from 'crypto';

/**
 * نظام صافيو لمنع تكرار الوكلاء
 * يكشف التطابق الكامل والجزئي بين Agents
 */

class DuplicationDetector {
  constructor() {
    this.registryPath = path.join(process.cwd(), 'agents/registry.yaml');
    this.lockPath = path.join(process.cwd(), '.agents.lock');
  }

  calculateFingerprint(agent) {
    const core = {
      id: agent.id,
      name: agent.name,
      category: agent.category,
      contexts: JSON.stringify(agent.contexts || []),
      models: JSON.stringify(agent.models || [])
    };
    return crypto.createHash('sha256')
      .update(JSON.stringify(core))
      .digest('hex');
  }

  checkSimilarity(agent1, agent2) {
    let similarity = 0;
    
    if (agent1.id === agent2.id) return 100;
    
    if (agent1.name?.toLowerCase() === agent2.name?.toLowerCase()) {
      similarity += 50;
    }
    
    if (agent1.category === agent2.category) similarity += 25;
    
    const contexts1 = new Set(agent1.contexts?.allowed || []);
    const contexts2 = new Set(agent2.contexts?.allowed || []);
    const overlap = [...contexts1].filter(c => contexts2.has(c)).length;
    if (contexts1.size > 0 || contexts2.size > 0) {
      similarity += (overlap / Math.max(contexts1.size, contexts2.size)) * 25;
    }
    
    return similarity;
  }

  async detectDuplicates() {
    try {
      const registryContent = await fs.readFile(this.registryPath, 'utf8');
      const registry = YAML.parse(registryContent);
      
      if (!registry?.agents || !Array.isArray(registry.agents)) {
        throw new Error('Registry format invalid');
      }
      
      const duplicates = [];
      const fingerprints = new Map();
      const seenIds = new Set();

      for (let i = 0; i < registry.agents.length; i++) {
        const agent = registry.agents[i];
        
        if (!agent?.id) {
          duplicates.push({
            type: 'invalid',
            agent1: `index-${i}`,
            agent2: 'missing-id',
            similarity: 0
          });
          continue;
        }
        
        // Check exact ID duplication
        if (seenIds.has(agent.id)) {
          duplicates.push({
            type: 'exact-id',
            agent1: agent.id,
            agent2: agent.id,
            similarity: 100
          });
        }
        seenIds.add(agent.id);
        
        const fp = this.calculateFingerprint(agent);
        
        if (fingerprints.has(fp)) {
          duplicates.push({
            type: 'exact',
            agent1: fingerprints.get(fp),
            agent2: agent.id,
            similarity: 100
          });
        } else {
          fingerprints.set(fp, agent.id);
        }
        
        for (let j = i + 1; j < registry.agents.length; j++) {
          const other = registry.agents[j];
          if (!other?.id) continue;
          
          const sim = this.checkSimilarity(agent, other);
          
          if (sim >= 70) {
            duplicates.push({
              type: 'similar',
              agent1: agent.id,
              agent2: other.id,
              similarity: sim
            });
          }
        }
      }

      return duplicates;
    } catch (err) {
      throw new Error(`Failed to detect duplicates: ${err.message}`);
    }
  }

  async generateReport() {
    const duplicates = await this.detectDuplicates();
    
    if (duplicates.length === 0) {
      return {
        status: 'clean',
        message: '✅ Registry نظيف - لا توجد تكرارات',
        duplicates: []
      };
    }
    
    return {
      status: 'duplicates-found',
      message: `❌ تم اكتشاف ${duplicates.length} تكرار`,
      duplicates: duplicates.map(d => ({
        type: d.type,
        agents: [d.agent1, d.agent2],
        similarity: `${d.similarity}%`
      }))
    };
  }
}

// CLI Execution
if (import.meta.url === `file://${process.argv[1]}`) {
  const detector = new DuplicationDetector();
  
  detector.generateReport()
    .then(report => {
      console.log(report.message);
      if (report.duplicates.length > 0) {
        console.log('\n📊 التفاصيل:');
        report.duplicates.forEach((dup, i) => {
          console.log(`  ${i + 1}. [${dup.type}] ${dup.agents[0]} ↔ ${dup.agents[1]} (${dup.similarity})`);
        });
        process.exit(1);
      }
      process.exit(0);
    })
    .catch(err => {
      console.error('❌ خطأ:', err.message);
      process.exit(1);
    });
}

export { DuplicationDetector };
