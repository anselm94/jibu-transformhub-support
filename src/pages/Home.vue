<template>
    <div class="max-w-3xl py-12 mx-auto">
        <Button @click="showDialog = true">Open Dialog</Button>
        <Dialog title="Title" v-model="showDialog"> Dialog content </Dialog>
    </div>
</template>

<script>
import { Dialog } from 'frappe-ui'

export default {
    name: 'Home',
    data() {
        return {
            showDialog: false,
        }
    },
    components: {
        Dialog,
    },
}
</script>