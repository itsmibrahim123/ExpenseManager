package com.practice.expensemngr.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.util.List;

/**
 * DTO for paginated transaction search results
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TransactionSearchResponseDTO implements Serializable {
    private static final long serialVersionUID = 1L;

    private List<TransactionSearchItemDTO> transactions;
    private Long totalElements;
    private Integer totalPages;
    private Integer currentPage;
    private Integer pageSize;
    private TransactionFilterDTO appliedFilters;
}