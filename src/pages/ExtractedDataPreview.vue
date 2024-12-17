<script setup lang="ts">
import { useRouter } from "vue-router";
import { useImageStore } from "../store";
import { Button } from "frappe-ui";

const router = useRouter()

const imageStore = useImageStore()

/// Event Handlers
function onBackPress() {
    router.push({ name: "capture-photo-scan" })
}
</script>

<template>
    <div class="container mx-auto p-4">
        <div>
            <div class="flex flex-row justify-between items-center py-4">
                <h1
                    class="text-4xl font-extrabold leading-none tracking-tight text-gray-900 md:text-5xl lg:text-p-3xl dark:text-white">
                    Extracted Data Preview</h1>
                <Button variant="outline" theme="gray" size="lg" label="Back" @click="onBackPress">
                    Back
                </Button>
            </div>
            <table class="table-auto w-full text-left rtl:text-right text-gray-700 dark:text-gray-400"
                v-for="table in imageStore.extractedTable?.tables">
                <thead class="text-gray-800 uppercase bg-gray-200 dark:bg-gray-700 dark:text-gray-400">
                    <tr>
                        <td class="px-2 py-2" v-for="cell in table.rows[0].cells">{{ cell }}</td>
                    </tr>
                </thead>
                <tbody>
                    <tr class="bg-white border-b dark:bg-gray-800 dark:border-gray-700"
                        v-for="row in table.rows.slice(1)">
                        <td class="px-2 py-2" v-for="cell in row.cells">{{ cell }}</td>
                    </tr>
                </tbody>
            </table>
        </div>
    </div>
</template>

<style lang="postcss" scoped></style>
