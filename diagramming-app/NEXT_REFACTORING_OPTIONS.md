# Remaining Refactoring Options

## Status: Option 1 Complete ✅

Option 1 (Extract Custom Hooks) has been successfully implemented. This document outlines the remaining refactoring options for future incremental improvements.

---

## Option 2: Enable TypeScript Strict Mode

### Goal
Enable strict TypeScript compiler options to catch more bugs at compile-time and improve type safety.

### Benefits
- Catch null/undefined bugs before runtime
- Improve IDE autocomplete and type inference
- Better documentation through types
- Easier refactoring with confidence
- Industry standard for TypeScript projects

### Implementation Plan

1. **Enable Strict Flags Incrementally** (tsconfig.json)
   ```json
   {
     "compilerOptions": {
       "strict": false,  // Don't enable all at once
       "noImplicitAny": true,           // ← Start here
       "strictNullChecks": false,        // ← Add next
       "strictFunctionTypes": false,
       "strictBindCallApply": false,
       "strictPropertyInitialization": false,
       "noImplicitThis": false,
       "alwaysStrict": false
     }
   }
   ```

2. **Fix `noImplicitAny` Violations**
   - Add explicit types to function parameters
   - Type all variables with `any`
   - Add return types to functions

3. **Enable `strictNullChecks`**
   - Add `| null` or `| undefined` to nullable types
   - Use optional chaining `?.` and nullish coalescing `??`
   - Add null checks before accessing properties

4. **Continue with Remaining Flags**
   - One flag at a time
   - Fix errors before enabling next flag
   - Test after each flag

### Estimated Effort
- **Time**: 4-8 hours
- **Risk**: Low (caught at compile-time)
- **Files Affected**: ~20-30 files

### Success Metrics
- Zero TypeScript errors with strict mode enabled
- Improved type coverage
- Better IDE support

---

## Option 3: Implement Command Pattern for Undo/Redo

### Goal
Replace the current snapshot-based history with a Command pattern for more granular, memory-efficient undo/redo.

### Current Issues
- Stores entire sheet state for each undo step
- Memory usage grows with complex diagrams
- Limited to 100 states
- Can't undo/redo across sessions

### Benefits
- **90% less memory** - only stores changes, not full state
- Unlimited undo history (or configurable limit)
- Persistent undo/redo (survives page refresh)
- Easier to add new undoable operations
- Industry standard pattern

### Implementation Plan

1. **Create Command Interface**
   ```typescript
   interface Command {
     execute(): void;
     undo(): void;
     redo(): void;
   }
   ```

2. **Implement Concrete Commands**
   - `MoveShapeCommand`
   - `ResizeShapeCommand`
   - `DeleteShapeCommand`
   - `AddShapeCommand`
   - `UpdateTextCommand`
   - `AddConnectorCommand`
   - `DeleteConnectorCommand`
   - etc.

3. **Create Command Manager**
   - Replaces `useHistoryStore`
   - Maintains undo/redo stacks
   - Executes and reverses commands

4. **Update Store Actions**
   - Each action creates a command
   - Commands pushed to manager
   - Manager handles execution

5. **Persist History** (optional)
   - Store commands in IndexedDB
   - Restore on page load
   - Compress old commands

### Example
```typescript
// Before (snapshot-based)
addHistory(sheets, activeSheetId);  // Stores entire sheet
moveShape(id, newX, newY);

// After (command-based)
const command = new MoveShapeCommand(id, oldX, oldY, newX, newY);
commandManager.execute(command);  // Stores only the change
```

### Estimated Effort
- **Time**: 12-20 hours
- **Risk**: Medium (affects core state management)
- **Files Affected**: ~15-20 files

### Success Metrics
- Memory usage reduced by 90%
- Undo/redo faster
- History survives page refresh
- All operations still undoable

---

## Option 4: Migrate to React Query for Server State

### Goal
Separate server state (diagrams, users, orgs) from client state (UI, selection, zoom) using React Query.

### Current Issues
- Server and client state mixed in Zustand
- Manual cache invalidation
- No automatic refetching
- Optimistic updates are complex
- No background sync

### Benefits
- **Automatic caching** - no manual cache management
- **Background refetching** - keeps data fresh
- **Optimistic updates** - instant UI feedback
- **Error handling** - built-in retry logic
- **DevTools** - inspect cache and network requests
- **Less code** - React Query handles complexity

### Implementation Plan

1. **Install React Query**
   ```bash
   npm install @tanstack/react-query
   ```

2. **Setup Query Client**
   ```typescript
   const queryClient = new QueryClient({
     defaultOptions: {
       queries: {
         staleTime: 5 * 60 * 1000,  // 5 minutes
         cacheTime: 10 * 60 * 1000, // 10 minutes
       },
     },
   });
   ```

3. **Create Custom Hooks**
   - `useDiagram(diagramId)` - fetch single diagram
   - `useDiagrams()` - fetch user's diagrams
   - `useUpdateDiagram()` - mutation for updates
   - `useDeleteDiagram()` - mutation for deletion
   - etc.

4. **Migrate Zustand Store**
   - Keep only UI state in Zustand
   - Move server state to React Query
   - Update components to use new hooks

5. **Implement Optimistic Updates**
   ```typescript
   const { mutate } = useUpdateDiagram();
   mutate(newData, {
     onMutate: async (newData) => {
       // Cancel outgoing refetches
       await queryClient.cancelQueries(['diagram', id]);
       // Snapshot previous value
       const previous = queryClient.getQueryData(['diagram', id]);
       // Optimistically update
       queryClient.setQueryData(['diagram', id], newData);
       return { previous };
     },
     onError: (err, newData, context) => {
       // Rollback on error
       queryClient.setQueryData(['diagram', id], context.previous);
     },
   });
   ```

6. **Add Background Sync**
   - Refetch on window focus
   - Refetch on network reconnect
   - Periodic background refetch

### Estimated Effort
- **Time**: 16-24 hours
- **Risk**: Medium-High (major architectural change)
- **Files Affected**: ~25-35 files

### Success Metrics
- Server state separated from client state
- No manual cache invalidation
- Optimistic updates working
- Background sync active
- Reduced Zustand store size

---

## Recommended Order

1. ✅ **Option 1: Extract Custom Hooks** (COMPLETE)
2. **Option 2: TypeScript Strict Mode** (Low risk, high value)
3. **Option 3: Command Pattern** (Medium risk, high value)
4. **Option 4: React Query** (Higher risk, requires careful planning)

### Rationale
- Start with lowest risk, build confidence
- Each option provides value independently
- Can pause between options
- Earlier options make later ones easier

---

## Alternative: Big Bang Refactor

If preferred, all options could be implemented together in a major refactor:

### Pros
- Single large effort
- All benefits at once
- No incremental complexity

### Cons
- Higher risk of bugs
- Longer development time
- Harder to review
- More difficult to test
- Potential for feature regressions

**Recommendation**: Stick with incremental approach for this project.

---

## Questions to Consider

Before proceeding with next option, discuss:

1. **Priority**: Which option provides most value for your use case?
2. **Resources**: How much time is available for refactoring?
3. **Risk Tolerance**: Comfortable with medium-risk changes?
4. **Testing**: Manual or automated testing preferred?
5. **Timeline**: When does this need to be done?

---

## Next Steps

When ready for Option 2:
1. Review this document
2. Confirm scope and timeline
3. Create feature branch
4. Enable first strict flag
5. Fix errors incrementally
6. Test thoroughly
7. Merge and deploy

---

**Status**: Awaiting decision on next refactoring option
**Last Updated**: 2024
**Contact**: Prompt me when ready to proceed
