// Debug helper to inspect conversation data
export const debugConversations = (conversations) => {
  const { t } = useTranslation();
  if (!conversations || conversations.length === 0) {
    console.log('No conversations to debug');
    return;
  }

  console.log('=== CONVERSATION NAMES DEBUG ===');
  console.log(`Total conversations: ${conversations.length}`);
  
  // Check first 5 conversations
  const sample = conversations.slice(0, 5);
  
  sample.forEach((conv, index) => {
    console.log(`\nConversation ${index + 1}:`);
    console.log(`  ID: ${conv.id}`);
    console.log(`  Name: "${conv.name}"`);
    console.log(`  Created: ${conv.created_at}`);
    console.log(`  Has profile: ${!!conv.profile}`);
    console.log(`  Needs name update: ${conv.profile?.needs_name_update}`);
  });
  
  // Check for conversations without proper names
  const withoutNames = conversations.filter(c => 
    !c.name || 
    c.name === 'New Conversation' || 
    c.name.startsWith('New Property Search')
  );
  
  console.log(`\nConversations needing names: ${withoutNames.length}`);
  if (withoutNames.length > 0) {
    console.log('First 3 without proper names:', withoutNames.slice(0, 3).map(c => ({
      id: c.id,
      name: c.name,
      hasProfile: !!c.profile
    })));
  }
  
  // Check for successfully generated names
  const withGeneratedNames = conversations.filter(c => 
    c.name && 
    !c.name.startsWith('New') && 
    !c.name.includes('Conversation')
  );
  
  console.log(`\nConversations with generated names: ${withGeneratedNames.length}`);
  if (withGeneratedNames.length > 0) {
    console.log('Sample generated names:', withGeneratedNames.slice(0, 5).map(c => c.name));
  }
  
  console.log('=== END DEBUG ===');
};

// Make it available globally for console debugging
if (typeof window !== 'undefined') {
  window.debugConversations = debugConversations;
}